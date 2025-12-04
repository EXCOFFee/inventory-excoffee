/**
 * Servicio de Email para InventoryPro
 * Usa Nodemailer para enviar correos electrónicos
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  /**
   * Inicializa el transporter de nodemailer
   */
  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('Configuración SMTP incompleta. Los emails no se enviarán.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    // Verificar conexión
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(`Error verificando SMTP: ${error.message}`);
      } else {
        this.logger.log('Servicio de email configurado correctamente');
      }
    });
  }

  /**
   * Envía un correo electrónico
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Transporter no configurado. Email no enviado.');
      return false;
    }

    try {
      const from = this.configService.get<string>('SMTP_FROM') || 'noreply@inventorypro.com';
      
      await this.transporter.sendMail({
        from: `"InventoryPro" <${from}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      this.logger.log(`Email enviado a: ${options.to}`);
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error enviando email: ${err.message}`);
      return false;
    }
  }

  /**
   * Envía notificación de stock bajo
   */
  async sendLowStockAlert(
    userEmail: string,
    productName: string,
    currentStock: number,
    minStock: number,
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .product-name { font-size: 20px; font-weight: bold; color: #1f2937; }
            .stock-info { display: flex; gap: 30px; margin: 20px 0; }
            .stock-item { text-align: center; }
            .stock-value { font-size: 32px; font-weight: bold; }
            .stock-value.warning { color: #f59e0b; }
            .stock-value.danger { color: #dc2626; }
            .stock-label { color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Alerta de Stock Bajo</h1>
            </div>
            <div class="content">
              <p>Hola,</p>
              <p>Te notificamos que el siguiente producto tiene stock bajo:</p>
              
              <div class="alert-box">
                <p class="product-name">${productName}</p>
                <div class="stock-info">
                  <div class="stock-item">
                    <div class="stock-value ${currentStock === 0 ? 'danger' : 'warning'}">${currentStock}</div>
                    <div class="stock-label">Stock Actual</div>
                  </div>
                  <div class="stock-item">
                    <div class="stock-value">${minStock}</div>
                    <div class="stock-label">Stock Mínimo</div>
                  </div>
                </div>
              </div>
              
              <p>Te recomendamos reabastecer este producto lo antes posible.</p>
              
              <a href="${this.configService.get('FRONTEND_URL')}/alerts" class="button">
                Ver Alertas
              </a>
            </div>
            <div class="footer">
              <p>InventoryPro - Sistema de Gestión de Inventarios</p>
              <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `⚠️ Stock Bajo: ${productName} (${currentStock} unidades)`,
      html,
    });
  }

  /**
   * Envía código de verificación 2FA
   */
  async send2FACode(userEmail: string, code: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; text-align: center; }
            .code-box { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1f2937; font-family: monospace; }
            .warning { color: #dc2626; font-size: 14px; margin-top: 20px; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verificación de Seguridad</h1>
            </div>
            <div class="content">
              <p>Usa el siguiente código para completar tu inicio de sesión:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p>Este código expira en 5 minutos.</p>
              
              <p class="warning">⚠️ Si no solicitaste este código, alguien podría estar intentando acceder a tu cuenta. Cambia tu contraseña inmediatamente.</p>
            </div>
            <div class="footer">
              <p>InventoryPro - Sistema de Gestión de Inventarios</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🔐 Código de Verificación - InventoryPro',
      html,
    });
  }

  /**
   * Envía resumen diario de movimientos
   */
  async sendDailySummary(
    userEmail: string,
    summary: {
      totalMovements: number;
      entries: number;
      exits: number;
      lowStockProducts: number;
      totalValue: number;
    },
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .stat-box { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 28px; font-weight: bold; color: #1f2937; }
            .stat-value.green { color: #10b981; }
            .stat-value.red { color: #dc2626; }
            .stat-value.orange { color: #f59e0b; }
            .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
            .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Resumen Diario</h1>
            </div>
            <div class="content">
              <p>Aquí tienes el resumen de actividad del día:</p>
              
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-value">${summary.totalMovements}</div>
                  <div class="stat-label">Movimientos Totales</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value green">+${summary.entries}</div>
                  <div class="stat-label">Entradas</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value red">-${summary.exits}</div>
                  <div class="stat-label">Salidas</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value orange">${summary.lowStockProducts}</div>
                  <div class="stat-label">Productos con Stock Bajo</div>
                </div>
              </div>
              
              <p style="font-size: 18px; text-align: center;">
                <strong>Valor Total del Inventario:</strong><br>
                <span style="font-size: 24px; color: #10b981;">$${summary.totalValue.toLocaleString()}</span>
              </p>
              
              <div style="text-align: center;">
                <a href="${this.configService.get('FRONTEND_URL')}/reports" class="button">
                  Ver Reportes Completos
                </a>
              </div>
            </div>
            <div class="footer">
              <p>InventoryPro - Sistema de Gestión de Inventarios</p>
              <p>Fecha: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `📊 Resumen Diario - ${new Date().toLocaleDateString('es-ES')}`,
      html,
    });
  }

  /**
   * Elimina tags HTML de un string
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}
