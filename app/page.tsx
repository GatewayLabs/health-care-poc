"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { contractABI, contractAddress, publicKey } from "./helper";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Heart,
  Shield,
  Wallet,
  Loader2,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { analyzeHealthData } from "./actions";
import { SHIELD_TESTNET_CHAIN_ID } from "./helper";

const validateInput = (value: string, min: number, max: number) => {
  const numValue = parseInt(value);
  if (value === "") return true; // Allow empty input
  if (isNaN(numValue)) return false;
  return numValue >= min && numValue <= max;
};

const encrypt = (value: bigint) => {
  const encryptedVote = publicKey.encrypt(value);
  let hexString = encryptedVote.toString(16);
  if (hexString.length % 2) {
    hexString = "0" + hexString; // Ensure even length
  }
  return "0x" + hexString;
};

export default function HealthCalculator() {
  const [name, setName] = useState("");
  const [contract, setContract] = useState<ethers.Contract>();
  const [heartRate, setHeartRate] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [oxygenLevel, setOxygenLevel] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    message: string;
    risk_level?: number;
    risk_category?: string;
    hash?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleChainChanged = () => {
    connectWallet();
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", connectWallet);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", connectWallet);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [isCorrectNetwork, walletAddress]);

  const updateBalance = async (address: string) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(address);
    setBalance(ethers.formatEther(balance));
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      setIsLoading(true);
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        setIsWalletConnected(true);
        setWalletAddress(accounts[0]);
        await checkAndSwitchNetwork();
        updateBalance(accounts[0]);

        const contractInstance = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        setContract(contractInstance);
        toast({
          title: "Wallet Connected",
          description: "Your wallet has been successfully connected.",
        });
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect your wallet. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this feature.",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [{ eth_accounts: {} }],
        });
        setWalletAddress("");
        setBalance("0");
        setIsWalletConnected(false);
      } catch (error) {
        console.error("Failed to disconnect wallet:", error);
        toast({
          title: "Error",
          description: "Failed to disconnect wallet. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const checkAndSwitchNetwork = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        if (chainId === SHIELD_TESTNET_CHAIN_ID) {
          setIsCorrectNetwork(true);
        } else {
          setIsCorrectNetwork(false);
          await switchToShieldTestnet();
        }
      } catch (error) {
        console.error("Failed to check or switch network:", error);
        toast({
          title: "Network Error",
          description:
            "Failed to check or switch to the correct network. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const switchToShieldTestnet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SHIELD_TESTNET_CHAIN_ID }],
        });
        setIsCorrectNetwork(true);

        toast({
          title: "Network Switched",
          description: "Successfully switched to Gateway Shield Testnet.",
        });
      } catch (switchError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((switchError as any).code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: SHIELD_TESTNET_CHAIN_ID,
                  chainName: "Gateway Shield Testnet",
                  nativeCurrency: {
                    name: "Gateway",
                    symbol: "OWN",
                    decimals: 18,
                  },
                  rpcUrls: [
                    "https://gateway-shield-testnet.rpc.caldera.xyz/http",
                  ],
                  blockExplorerUrls: [
                    "https://gateway-shield-testnet.explorer.caldera.xyz",
                  ],
                },
              ],
            });
            setIsCorrectNetwork(true);
            toast({
              title: "Network Added",
              description:
                "Gateway Shield Testnet has been added to your MetaMask.",
            });
          } catch (addError) {
            console.error("Failed to add Shield Testnet:", addError);
            toast({
              title: "Network Addition Failed",
              description:
                "Failed to add Gateway Shield Testnet. Please add it manually in MetaMask.",
              variant: "destructive",
            });
          }
        }
        console.error("Failed to switch to Shield Testnet:", switchError);
        toast({
          title: "Network Switch Failed",
          description:
            "Failed to switch to Gateway Shield Testnet. Please try again or switch manually.",
          variant: "destructive",
        });
      }
    }
  };
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    if (contract) {
      try {
        if (parseFloat(balance) < 1) {
          toast({
            title: "Insufficient Balance",
            description:
              "You need at least 1 OWN token to perform analysis. Please get more tokens from the faucet.",
            variant: "destructive",
          });
          return;
        }

        const result = await analyzeHealthData({
          heartRate: parseInt(heartRate),
          bloodPressure: parseInt(bloodPressure),
          oxygenLevel: parseInt(oxygenLevel),
          balance: balance,
        });

        if (result.success) {
          const encryptedData = {
            heartRate: encrypt(BigInt(parseInt(heartRate))),
            bloodPressure: encrypt(BigInt(parseInt(bloodPressure))),
            oxygenLevel: encrypt(BigInt(parseInt(oxygenLevel))),
            riskLevel: encrypt(BigInt(result.risk_level as number)),
          };

          const tx = await contract.submitHealthMetrics(
            encryptedData.heartRate,
            encryptedData.bloodPressure,
            encryptedData.oxygenLevel,
            encryptedData.riskLevel
          );

          await tx.wait();

          if (tx.hash) {
            setAnalysisResult({
              message: result.message,
              risk_level: result.risk_level,
              risk_category: result.risk_category,
              hash: tx.hash,
            });
          }
        }

        toast({
          title: result.success ? "Analysis Complete" : "Analysis Failed",
          description: result.message,
          variant: result.variant,
        });
      } catch (error) {
        console.error("Analysis failed:", error);
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze your health data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const isFormValid = () => {
    const hr = parseInt(heartRate);
    const bp = parseInt(bloodPressure);
    const ol = parseInt(oxygenLevel);

    return (
      name !== "" &&
      !isNaN(hr) &&
      hr >= 1 &&
      hr <= 1000 &&
      !isNaN(bp) &&
      bp >= 1 &&
      bp <= 1000 &&
      !isNaN(ol) &&
      ol >= 1 &&
      ol <= 1000 &&
      parseFloat(balance) >= 1 &&
      !isAnalyzing
    );
  };

  const handleHeartRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateInput(value, 1, 1000)) {
      setHeartRate(value);
    }
  };

  const handleBloodPressureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (validateInput(value, 1, 1000)) {
      setBloodPressure(value);
    }
  };

  const handleOxygenLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateInput(value, 1, 1000)) {
      setOxygenLevel(value);
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("chainChanged", () => {
        checkAndSwitchNetwork();
      });
    }

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
  });

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Connect Your Wallet
            </CardTitle>
            <CardDescription className="text-center">
              Please connect your MetaMask wallet to access the Health Risk
              Calculator
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={connectWallet}
              className="bg-indigo-600 hover:bg-indigo-700"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect MetaMask
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Switch Network
            </CardTitle>
            <CardDescription className="text-center">
              Please switch to the Gateway Shield Testnet to use the Health Risk
              Calculator
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={switchToShieldTestnet}
              className="bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              Switch to Gateway Shield Testnet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            Private Health Risk Calculator
          </CardTitle>
          <CardDescription className="text-lg">
            Analyze your vital signs securely using encrypted computation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <div className="flex flex-wrap justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Wallet Address
                </p>
                <p className="text-sm font-mono break-all">{walletAddress}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">OWN Balance</p>
                <p className="text-sm font-mono">
                  {parseFloat(balance).toFixed(4)} OWN
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              {parseFloat(balance) < 0.1 && ( // You can adjust this threshold as needed
                <Button
                  onClick={() => {
                    window.open("https://faucet.gateway.tech/", "_blank");
                    disconnectWallet();
                  }}
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  size="sm"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Get Test Tokens
                </Button>
              )}
              <Button
                onClick={disconnectWallet}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                size="sm"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Disconnect Wallet
              </Button>
            </div>
            {parseFloat(balance) < 0.1 && (
              <>
                <p className="text-sm text-blue-600 mt-2">
                  Your balance is low. Get test tokens from the faucet to
                  continue.
                </p>
                <p className="text-sm text-yellow-600 mt-1.5 italic">
                  Note: It takes about 5-10 sec to get tokens
                </p>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold">Vital Signs</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="heartRate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Heart Rate
                  </label>
                  <div className="relative">
                    <Input
                      id="heartRate"
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="0"
                      value={heartRate}
                      onChange={handleHeartRateChange}
                      className={`pr-16 ${
                        !validateInput(heartRate, 1, 1000) && heartRate !== ""
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      BPM
                    </span>
                  </div>
                  {!validateInput(heartRate, 1, 1000) && heartRate !== "" && (
                    <p className="text-xs text-red-500 mt-1">
                      Value must be between 1 and 1000
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    60-100 normal range
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="bloodPressure"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Blood Pressure (Systolic)
                  </label>
                  <div className="relative">
                    <Input
                      id="bloodPressure"
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="0"
                      value={bloodPressure}
                      onChange={handleBloodPressureChange}
                      className={`pr-16 ${
                        !validateInput(bloodPressure, 1, 1000) &&
                        bloodPressure !== ""
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      mmHg
                    </span>
                  </div>
                  {!validateInput(bloodPressure, 1, 1000) &&
                    bloodPressure !== "" && (
                      <p className="text-xs text-red-500 mt-1">
                        Value must be between 1 and 1000
                      </p>
                    )}
                  <p className="text-xs text-gray-500 mt-1">
                    90-140 normal range
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="oxygenLevel"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Oxygen Level
                  </label>
                  <div className="relative">
                    <Input
                      id="oxygenLevel"
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="0"
                      value={oxygenLevel}
                      onChange={handleOxygenLevelChange}
                      className={`pr-8 ${
                        !validateInput(oxygenLevel, 1, 1000) &&
                        oxygenLevel !== ""
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  </div>
                  {!validateInput(oxygenLevel, 1, 1000) &&
                    oxygenLevel !== "" && (
                      <p className="text-xs text-red-500 mt-1">
                        Value must be between 1 and 1000
                      </p>
                    )}
                  <p className="text-xs text-gray-500 mt-1">
                    95-100 normal range
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              size="lg"
              onClick={handleAnalyze}
              disabled={!isFormValid()}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Risk"
              )}
            </Button>

            {!isFormValid() && !isAnalyzing && (
              <p className="text-sm text-red-600 text-center">
                {parseFloat(balance) < 1
                  ? "You need at least 1 OWN token to perform analysis"
                  : "Please fill in all vital signs to analyze"}
              </p>
            )}

            {analysisResult && (
              <Card className="border-2 border-indigo-100">
                <CardHeader>
                  <CardTitle className="text-xl">Analysis Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Risk Category:</span>
                    <span className="font-semibold">
                      {analysisResult.risk_category}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Risk Level:</span>
                    <span className="font-semibold">
                      {analysisResult.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between ">
                    <span className="text-gray-600">Transaction:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-800">
                        {analysisResult.hash
                          ? `${analysisResult.hash.slice(0, 6)}...
                        ${analysisResult.hash.slice(-4)}`
                          : null}
                      </span>
                      <a
                        href={`https://gateway-shield-testnet.explorer.caldera.xyz/tx/${analysisResult.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            analysisResult.hash as string
                          );
                          toast({
                            title: "Copied!",
                            description: "Transaction hash copied to clipboard",
                          });
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{
                          width: `${(analysisResult.risk_level || 0) * 20}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert variant="destructive" className="bg-blue-50 border-blue-200">
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm text-blue-800">
                Your vital signs are processed using secure multi-party
                computation. The data remains encrypted throughout analysis.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
