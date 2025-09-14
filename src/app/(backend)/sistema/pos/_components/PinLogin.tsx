"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, Check, X, Delete, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface PinLoginProps {
  onLogin: (
    userId: string,
    pin: string
  ) => Promise<{ success: boolean; error?: string; user?: any }>;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  maxAttempts?: number;
}

export default function PinLogin({
  onLogin,
  onCancel,
  title = "Acceso Caja POS",
  subtitle = "Ingresa tu PIN para acceder al sistema",
  maxAttempts = 3,
}: PinLoginProps) {
  const [step, setStep] = useState<"user" | "pin">("user");
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  const pinInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus pin input when step changes
  useEffect(() => {
    if (step === "pin" && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [step]);

  // Handle lockout timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime(lockoutTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockoutTime === 0) {
      setIsLocked(false);
      setAttempts(0);
      setError("");
    }
  }, [lockoutTime, isLocked]);

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      setStep("pin");
      setError("");
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }

    if (isLocked) {
      setError(`Sistema bloqueado. Espera ${lockoutTime} segundos`);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await onLogin(userId, pin);

      if (result.success) {
        // Reset form
        setStep("user");
        setUserId("");
        setPin("");
        setAttempts(0);
        setError("");
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= maxAttempts) {
          setIsLocked(true);
          setLockoutTime(30); // 30 seconds lockout
          setError(
            "Demasiados intentos fallidos. Sistema bloqueado por 30 segundos"
          );
        } else {
          setError(result.error || "PIN incorrecto");
        }

        setPin("");
      }
    } catch (error) {
      console.error("Pin login error:", error);
      setError("Error de conexión. Inténtalo de nuevo");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinInput = (digit: string) => {
    if (isLocked || pin.length >= 6) return;
    setPin((prev) => prev + digit);
    setError("");
  };

  const handlePinBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleBack = () => {
    setStep("user");
    setPin("");
    setError("");
  };

  const keypadNumbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "backspace"],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/10">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {title}
            </CardTitle>
            <p className="text-blue-200 mt-2">{subtitle}</p>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === "user" ? (
                <motion.form
                  key="user-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleUserSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Usuario / Empleado
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Ingresa tu usuario"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-400 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={!userId.trim() || isLocked}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Continuar
                    </Button>

                    {onCancel && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="w-full border-white/30 text-white hover:bg-white/10"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="pin-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <User className="h-4 w-4 text-blue-300" />
                      <span className="text-white font-medium">{userId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="h-6 w-6 p-0 text-blue-300 hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <p className="text-blue-200 text-sm mb-4">
                      Ingresa tu PIN de seguridad
                    </p>

                    {/* PIN Display */}
                    <div className="flex justify-center gap-2 mb-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
                            i < pin.length
                              ? "border-blue-400 bg-blue-400/20"
                              : "border-white/30 bg-white/10"
                          }`}
                        >
                          {i < pin.length && (
                            <div className="w-3 h-3 rounded-full bg-blue-400" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Hidden input for mobile keyboards */}
                    <input
                      ref={pinInputRef}
                      type="number"
                      inputMode="numeric"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.slice(0, 6))}
                      className="absolute opacity-0 pointer-events-none"
                      autoFocus
                    />
                  </div>

                  {/* Virtual Keypad */}
                  <div className="grid grid-cols-3 gap-3">
                    {keypadNumbers.flat().map((key, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="lg"
                        disabled={isLocked || isLoading}
                        onClick={() => {
                          if (key === "backspace") {
                            handlePinBackspace();
                          } else if (key !== "") {
                            handlePinInput(key);
                          }
                        }}
                        className={`h-14 text-lg font-bold border-white/30 text-white hover:bg-white/20 ${
                          key === "" ? "invisible" : ""
                        }`}
                      >
                        {key === "backspace" ? (
                          <Delete className="h-5 w-5" />
                        ) : (
                          key
                        )}
                      </Button>
                    ))}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-400 text-sm justify-center"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </motion.div>
                  )}

                  {isLocked && (
                    <div className="text-center">
                      <Badge variant="destructive" className="text-xs">
                        Bloqueado por {lockoutTime}s
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={isLoading}
                      className="flex-1 border-white/30 text-white hover:bg-white/10"
                    >
                      Atrás
                    </Button>

                    <Button
                      onClick={(e) => handlePinSubmit(e as any)}
                      disabled={pin.length < 4 || isLoading || isLocked}
                      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="text-center text-xs text-blue-300">
                    Intentos: {attempts} / {maxAttempts}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
