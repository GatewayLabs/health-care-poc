"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Shield, Wallet, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";

export const SHIELD_TESTNET_CHAIN_ID = "0xa5b5a";

export default function HealthCalculator() {
  const [name, setName] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [oxygenLevel, setOxygenLevel] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
        setIsWalletConnected(true);
        setWalletAddress(accounts[0]);
        await checkAndSwitchNetwork();
        updateBalance(accounts[0]);
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
    try {
      // Simulating analysis delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Analyzing vital signs:", {
        name,
        heartRate,
        bloodPressure,
        oxygenLevel,
      });
      toast({
        title: "Analysis Complete",
        description:
          "Your health risk has been calculated. Please consult with a healthcare professional for interpretation.",
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
                      placeholder="0"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      BPM
                    </span>
                  </div>
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
                      placeholder="0"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      mmHg
                    </span>
                  </div>
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
                      placeholder="0"
                      value={oxygenLevel}
                      onChange={(e) => setOxygenLevel(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    95-100 normal range
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              size="lg"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
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
