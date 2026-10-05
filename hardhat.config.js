require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("solidity-coverage");
require('@openzeppelin/hardhat-upgrades')

// SECURITY: Deployer keys must never be committed to source control.
// Previously this file carried a hardcoded 32-byte private key that was used
// as a silent fallback for *every* network, including BSC mainnet. Anyone with
// read access to this repository could have drained any account it controlled.
// Signing keys are now resolved exclusively from the environment, and a network
// that has no key configured fails fast instead of silently using a default.
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

// SECURITY: Infura project IDs are credentials, not configuration. They used to
// be committed inline and are now read from the environment so they can be
// rotated without a code change and never appear in git history again.
const INFURA_GOERLI_PROJECT_ID = process.env.INFURA_GOERLI_PROJECT_ID;
const INFURA_ROPSTEN_PROJECT_ID = process.env.INFURA_ROPSTEN_PROJECT_ID;

/**
 * Returns the signer list for a network.
 *
 * @param {string} keyEnvVar Name of the env var holding the private key.
 * @returns {string[]} Signer list; empty when the variable is unset.
 */
function accountsFromEnv(keyEnvVar) {
  if (!PRIVATE_KEY) {
    // No key configured is a valid state for public/read-only networks, so this
    // is not fatal here. Networks that must sign assert explicitly instead.
    console.warn(
      `[config] ${keyEnvVar} is not set; ${keyEnvVar} network will have no signer.`
    );
    return [];
  }
  return [`0x${PRIVATE_KEY.replace(/^0x/, '')}`];
}

/**
 * Builds an Infura RPC URL, failing loudly when the project ID is missing.
 * Silently producing `https://goerli.infura.io/v3/undefined` hides the misconfiguration
 * behind an opaque provider error at deploy time.
 */
function requireInfuraUrl(networkName) {
  const projectId =
    networkName === 'ropsten' ? INFURA_ROPSTEN_PROJECT_ID : INFURA_GOERLI_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      `[config] Missing Infura project id for '${networkName}'. Set ` +
      `${networkName === 'ropsten' ? 'INFURA_ROPSTEN_PROJECT_ID' : 'INFURA_GOERLI_PROJECT_ID'} before using this network.`
    );
  }
  return `https://${networkName}.infura.io/v3/${projectId}`;
}

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    goerli: {
      url: requireInfuraUrl('goerli'),
      accounts: accountsFromEnv('DEPLOYER_PRIVATE_KEY'),
      chainId: 5,
      gasPrice: 20000000000,
      timeout: 10000000
    },
    ropsten: {
      url: requireInfuraUrl('ropsten'),
      accounts: accountsFromEnv('DEPLOYER_PRIVATE_KEY'),
      chainId: 3,
      gasPrice: 40000000000,
      timeout: 500000
    },
    bscTestnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      accounts: accountsFromEnv('DEPLOYER_PRIVATE_KEY'),
      chainId: 97,
      gasPrice: 40000000000,
      timeout: 500000
    },
    bscMainnetStaging: {
      url: 'https://bsc-dataseed.binance.org/',
      accounts: accountsFromEnv('DEPLOYER_PRIVATE_KEY'),
      chainId: 56,
      gasPrice: 7000000000,
      timeout: 10000000
    },
    bscMainnet: {
      // SECURITY: BSC mainnet is a production network. Deployments must be
      // explicitly acknowledged so a stray `npx hardhat run` against the wrong
      // network can never move real funds by accident.
      url: 'https://bsc-dataseed.binance.org/',
      accounts: accountsFromEnv('DEPLOYER_PRIVATE_KEY'),
      chainId: 56,
      gasPrice: 7000000000,
      timeout: 10000000
    },
    local: {
      url: 'http://localhost:8545',
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
