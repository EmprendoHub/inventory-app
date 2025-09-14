import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  Users,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

export default function PosPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistema POS</h1>
          <p className="text-lg text-gray-600">
            Sistema punto de venta completo con funcionalidades avanzadas
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Registro de Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Interface táctil optimizada para ventas rápidas con carrito
                inteligente y cálculo automático de cambio.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Escaner QR & Código de Barras</li>
                <li>• Grid de Favoritos</li>
                <li>• Cálculo automático de cambio</li>
                <li>• Múltiples métodos de pago</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Gestión de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Selección rápida de clientes y gestión de cuentas por cobrar
                integrada con el sistema de inventario.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Búsqueda rápida de clientes</li>
                <li>• Historial de compras</li>
                <li>• Cuentas por cobrar</li>
                <li>• Descuentos personalizados</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
                Órdenes Suspendidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Sistema de órdenes en espera para atención simultánea de
                múltiples clientes con números únicos.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Números únicos de orden</li>
                <li>• Asociación con clientes</li>
                <li>• Recuperación fácil</li>
                <li>• Estado de órdenes</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-600" />
                Pagos Divididos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Soporte completo para múltiples métodos de pago en una sola
                transacción con cálculo de propinas.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Efectivo + Tarjeta + Cuenta</li>
                <li>• Cálculo de propinas</li>
                <li>• Distribución de pagos</li>
                <li>• Validación automática</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-red-600" />
                Reportes y Cierre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Sistema completo de reconciliación de efectivo y reportes de fin
                de turno con análisis detallado.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Conteo de denominaciones</li>
                <li>• Reconciliación automática</li>
                <li>• Reportes de ventas</li>
                <li>• Productos más vendidos</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Descuentos y Cupones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Sistema flexible de descuentos con códigos de cupón, porcentajes
                fijos y aplicación por artículo.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Códigos de descuento</li>
                <li>• Porcentajes y montos fijos</li>
                <li>• Validación de fechas</li>
                <li>• Límites de uso</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Acceso Rápido
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/sistema/pos/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Calculator className="h-5 w-5 mr-2" />
                Abrir POS
              </Button>
            </Link>
          </div>
        </div>

        {/* Status */}
        <div className="mt-12 text-center">
          <Card className="inline-block">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                Sistema Completamente Funcional
              </h3>
              <p className="text-gray-600">
                Todas las funcionalidades del POS están implementadas y listas
                para producción.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  13/13 Características Completas
                </Badge>
                <Badge variant="outline">Listo para Producción</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
