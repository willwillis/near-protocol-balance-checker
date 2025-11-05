'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { connect, utils, keyStores, providers } from 'near-api-js';

// Configuration for connecting to the NEAR mainnet
// Moved outside component to prevent recreation on every render
const nearConfig = {
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
  provider: new providers.FailoverRpcProvider([
    new providers.JsonRpcProvider({ url: 'https://rpc.mainnet.near.org' }),
    new providers.JsonRpcProvider({ url: 'https://free.rpc.fastnear.com' }),
    new providers.JsonRpcProvider({ url: 'https://near.blockpi.network/v1/rpc/public' }),
  ]),
  walletUrl: 'https://wallet.mainnet.near.org',
  helperUrl: 'https://helper.mainnet.near.org',
  explorerUrl: 'https://explorer.mainnet.near.org',
  keyStore: new keyStores.InMemoryKeyStore(),
};

// Request timeout in milliseconds (30 seconds)
const REQUEST_TIMEOUT = 30000;

// NEAR account ID validation patterns
// 1. Implicit address: exactly 64 hexadecimal characters
const IMPLICIT_ADDRESS_REGEX = /^[0-9a-f]{64}$/i;
// 2. Named address: domains like alice.near, sub.account.testnet
const NAMED_ADDRESS_REGEX = /^[a-z0-9_-]+(\.[a-z0-9_-]+)*\.(near|testnet)$/i;
// 3. Ethereum-like account: 0x followed by 40 hexadecimal characters
const ETHEREUM_LIKE_REGEX = /^0x[0-9a-f]{40}$/i;

interface BalanceData {
  available: string;
  staked: string;
  total: string;
}

interface ErrorWithType extends Error {
  type?: string;
}

export default function HomePage() {
  const [accountId, setAccountId] = useState('');
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [fetchedAccountId, setFetchedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Validate NEAR account ID format
  const validateAccountId = useCallback((id: string): string | null => {
    const trimmed = id.trim();
    if (!trimmed) {
      return 'Please enter a NEAR account ID.';
    }
    
    // Check for implicit address (64 hex characters)
    if (IMPLICIT_ADDRESS_REGEX.test(trimmed)) {
      return null;
    }
    
    // Check for named address (e.g., alice.near, sub.account.testnet)
    if (NAMED_ADDRESS_REGEX.test(trimmed)) {
      return null;
    }
    
    // Check for Ethereum-like account (0x followed by 40 hex characters)
    if (ETHEREUM_LIKE_REGEX.test(trimmed)) {
      return null;
    }
    
    // If none match, return error message
    return 'Please enter a valid NEAR account ID (implicit address, named address like alice.near, or Ethereum-like address like 0x...).';
  }, []);

  // Create a timeout promise for request cancellation with cleanup
  const createTimeoutPromise = useCallback((timeoutMs: number): { promise: Promise<never>; timeoutId: NodeJS.Timeout } => {
    let timeoutId!: NodeJS.Timeout;
    const promise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Request timed out. Please try again.'));
      }, timeoutMs);
    });
    return { promise, timeoutId };
  }, []);

  const handleFetchBalance = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate input
    const validationError = validateAccountId(accountId);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmedAccountId = accountId.trim();

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);
    setBalanceData(null);
    setFetchedAccountId(null);

    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Race between the actual request and timeout
      const fetchPromise = (async () => {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          throw new Error('Request cancelled');
        }

        // Connect to the NEAR network
        const near = await connect(nearConfig);
        const account = await near.account(trimmedAccountId);

        // Check if request was aborted
        if (abortController.signal.aborted) {
          throw new Error('Request cancelled');
        }

        // Get liquid and staked balance in parallel
        const [liquidBalanceData, stakedBalanceData] = await Promise.all([
          account.getAccountBalance(),
          account.getActiveDelegatedStakeBalance(),
        ]);

        // Check if request was aborted
        if (abortController.signal.aborted) {
          throw new Error('Request cancelled');
        }

        const availableBalance = liquidBalanceData.available;
        const stakedBalance = stakedBalanceData.total;

        const totalYocto = BigInt(availableBalance) + BigInt(stakedBalance);

        // Balances are in yoctoNEAR, so we format them to NEAR
        const formattedBalance = utils.format.formatNearAmount(availableBalance.toString(), 4);
        const formattedStaked = utils.format.formatNearAmount(stakedBalance, 4);
        const formattedTotal = utils.format.formatNearAmount(totalYocto.toString(), 4);

        return {
          available: formattedBalance,
          staked: formattedStaked,
          total: formattedTotal,
        };
      })();

      // Race between fetch and timeout with cleanup
      const { promise: timeoutPromise, timeoutId: id } = createTimeoutPromise(REQUEST_TIMEOUT);
      timeoutId = id;
      const result = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]);

      // Clear timeout if request succeeded
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Check if request was aborted after completion
      if (abortController.signal.aborted) {
        return;
      }

      setBalanceData(result);
      setFetchedAccountId(trimmedAccountId);
    } catch (e) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Don't set error if request was cancelled
      if (abortController.signal.aborted) {
        return;
      }

      console.error('Error fetching balance:', e);

      const error = e as ErrorWithType;
      let errorMessage = 'An error occurred while fetching the balance.';

      if (error.message === 'Request timed out. Please try again.') {
        errorMessage = 'Request timed out. The network may be slow. Please try again.';
      } else if (error.type === 'AccountDoesNotExist') {
        errorMessage = `Account "${trimmedAccountId}" does not exist on NEAR mainnet.`;
      } else if (error.message?.includes('Exceeded 3 providers') || error.message?.includes('Exceeded')) {
        errorMessage = 'All RPC providers failed. The NEAR network may be experiencing issues. Please try again later.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      // Clear timeout in finally block as well
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Only update loading state if this request wasn't cancelled
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountId(value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-start p-24 bg-white">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <img
            src="/near-token.png"
            alt="NEAR Token"
            className="w-16 h-16 rounded-full object-cover"
          />
          <h1 className="text-5xl font-semibold text-left text-[#000000] tracking-tight">
            NEAR Balance Checker
          </h1>
        </div>
        <form onSubmit={handleFetchBalance} className="flex items-start gap-3 mb-6">
          <label htmlFor="account-id" className="sr-only">
            NEAR Account ID
          </label>
          <input
            id="account-id"
            type="text"
            value={accountId}
            onChange={handleInputChange}
            placeholder="e.g., alice.near, 0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4, or fb9243ce..."
            aria-label="NEAR Account ID"
            aria-invalid={error ? 'true' : 'false'}
            {...(error && { 'aria-describedby': 'error-message' })}
            className="flex-grow p-4 border border-black/10 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-[#00ec97] focus:border-[#00ec97] transition text-black disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            disabled={loading}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            disabled={loading || !accountId.trim() || validateAccountId(accountId) !== null}
            aria-label={loading ? 'Fetching balance...' : 'Fetch balance'}
            className="px-8 py-4 bg-[#00ec97] text-black font-semibold rounded-lg hover:bg-[#00d488] focus:outline-none focus:ring-2 focus:ring-[#00ec97] focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
                <span>Fetching...</span>
              </span>
            ) : (
              'Fetch Balance'
            )}
          </button>
        </form>

        {/* Error message with aria-live for screen readers */}
        {error && (
          <div
            id="error-message"
            role="alert"
            aria-live="polite"
            className="mt-6 p-4 bg-[#ff7966]/10 border border-[#ff7966] rounded-lg text-[#ff7966] text-left"
          >
            {error}
          </div>
        )}

        {/* Success message with aria-live for screen readers */}
        {(() => {
          const hasBalanceData = fetchedAccountId && balanceData;
          if (!hasBalanceData) return null;

          return (
            <>
              <div
                role="status"
                aria-live="polite"
                className="mt-12 p-8 bg-white rounded-lg border border-black/10"
              >
                <h2 className="text-3xl font-semibold text-black mb-6">
                  Balance for{' '}
                  <span className="text-[#00ec97]">{fetchedAccountId}</span>
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-lg font-medium text-black inline">Available Balance:</dt>
                    <dd className="text-lg text-black inline ml-3">{balanceData.available} NEAR</dd>
                  </div>
                  <div>
                    <dt className="text-lg font-medium text-black inline">Staked Balance:</dt>
                    <dd className="text-lg text-black inline ml-3">{balanceData.staked} NEAR</dd>
                  </div>
                  <div className="pt-4 mt-4 border-t border-black/10">
                    <dt className="text-xl font-semibold text-black inline">Total Balance:</dt>
                    <dd className="text-xl font-semibold text-black inline ml-3">{balanceData.total} NEAR</dd>
                  </div>
                </dl>
              </div>

              {/* More Info section - only shown after balance is fetched */}
              <div className="mt-8 p-8 bg-white rounded-lg border border-black/10">
                <h3 className="text-2xl font-semibold text-black mb-6">More Info</h3>
                <div className="space-y-3">
                  <a
                    href={`https://pikespeak.ai/wallet-explorer/${fetchedAccountId}/money-flow`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[#00ec97] hover:text-black hover:underline transition text-lg"
                  >
                    Pikes Peak - Money Flow
                  </a>
                  <a
                    href={`https://explorer.mainnet.near.org/accounts/${fetchedAccountId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[#00ec97] hover:text-black hover:underline transition text-lg"
                  >
                    NEAR Explorer - Account Details
                  </a>
                  <a
                    href={`https://nearblocks.io/address/${fetchedAccountId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[#00ec97] hover:text-black hover:underline transition text-lg"
                  >
                    NEAR Blocks - Account Explorer
                  </a>
                </div>
              </div>
            </>
          );
        })()}

        {/* Built on NEAR, TypeScript, and Next.js badges */}
        <div className="mt-12 pt-8 border-t border-black/10">
          <div className="flex items-center justify-between">
            <a
              href="https://near.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="/built_on.png"
                alt="Built on NEAR"
                className="h-8"
              />
            </a>
            <a
              href="https://www.typescriptlang.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="/typescript-logo.png"
                alt="TypeScript"
                className="h-6"
              />
            </a>
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="/nextjs-logo.svg"
                alt="Built with Next.js"
                className="h-6"
              />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
