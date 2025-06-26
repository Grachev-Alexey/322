import puppeteer from 'puppeteer';
import { Offer } from '@shared/schema';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { execSync } from 'child_process';

interface PaymentScheduleItem {
  date: string;
  amount: number;
  description: string;
}

export class PDFGenerator {
  async generateOfferPDF(offer: Offer): Promise<Buffer> {
    let executablePath;
    try {
      executablePath = execSync('which chromium', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.log('Chromium not found, using default');
      executablePath = undefined;
    }

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--run-all-compositor-stages-before-draw',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-ipc-flooding-protection'
      ]
    });

    try {
      const page = await browser.newPage();
      
      const htmlContent = this.generateOfferHTML(offer);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private generateOfferHTML(offer: Offer): string {
    const paymentSchedule = offer.paymentSchedule as PaymentScheduleItem[];
    const selectedServices = offer.selectedServices as any[];
    const freeZones = (offer.freeZones as any[]) || [];
    const appliedDiscounts = (offer.appliedDiscounts as any[]) || [];

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Приложение №1 к договору-оферте</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            font-weight: bold;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            margin-bottom: 10px;
            text-decoration: underline;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .amount {
            text-align: right;
        }
        .total {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-block {
            width: 45%;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            margin: 20px 0 5px 0;
            height: 20px;
        }
        .footer {
            margin-top: 30px;
            font-size: 10pt;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ПРИЛОЖЕНИЕ №1</h1>
        <h2>к договору-оферте на оказание услуг по системе абонементов<br>
        в студиях аппаратной косметологии «Виви»</h2>
        <p><strong>№ ${offer.offerNumber}</strong></p>
        <p>от ${format(new Date(offer.createdAt!), 'dd MMMM yyyy', { locale: ru })} г.</p>
    </div>

    <div class="section">
        <div class="section-title">1. ИНФОРМАЦИЯ О КЛИЕНТЕ</div>
        <p><strong>Клиент:</strong> ${offer.clientName || 'Не указано'}</p>
        <p><strong>Телефон:</strong> ${offer.clientPhone}</p>
        <p><strong>Email:</strong> ${offer.clientEmail || 'Не указан'}</p>
    </div>

    <div class="section">
        <div class="section-title">2. ВЫБРАННЫЙ ПАКЕТ УСЛУГ</div>
        <p><strong>Тип пакета:</strong> ${this.getPackageName(offer.selectedPackage)}</p>
        <p><strong>Общая стоимость услуг без скидки:</strong> ${this.formatAmount(offer.baseCost)} руб.</p>
        <p><strong>Итоговая стоимость со скидкой:</strong> ${this.formatAmount(offer.finalCost)} руб.</p>
        <p><strong>Размер экономии:</strong> ${this.formatAmount(offer.totalSavings)} руб.</p>
    </div>

    <div class="section">
        <div class="section-title">3. СОСТАВ ПАКЕТА УСЛУГ</div>
        <table>
            <thead>
                <tr>
                    <th>№</th>
                    <th>Наименование услуги</th>
                    <th>Количество процедур</th>
                    <th>Стоимость за процедуру</th>
                    <th>Общая стоимость</th>
                </tr>
            </thead>
            <tbody>
                ${selectedServices.map((service, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${service.title}</td>
                        <td class="amount">${service.quantity}</td>
                        <td class="amount">${this.formatAmount(service.pricePerProcedure || service.priceMin)} руб.</td>
                        <td class="amount">${this.formatAmount((service.pricePerProcedure || service.priceMin) * service.quantity)} руб.</td>
                    </tr>
                `).join('')}
                ${freeZones.length > 0 ? freeZones.map((zone, index) => `
                    <tr style="background-color: #e8f5e8;">
                        <td>${selectedServices.length + index + 1}</td>
                        <td>${zone.title} (ПОДАРОК)</td>
                        <td class="amount">${zone.quantity}</td>
                        <td class="amount">0 руб.</td>
                        <td class="amount">0 руб.</td>
                    </tr>
                `).join('') : ''}
            </tbody>
        </table>
    </div>

    ${appliedDiscounts.length > 0 ? `
    <div class="section">
        <div class="section-title">4. ПРИМЕНЁННЫЕ СКИДКИ</div>
        <table>
            <thead>
                <tr>
                    <th>Вид скидки</th>
                    <th>Размер скидки</th>
                </tr>
            </thead>
            <tbody>
                ${appliedDiscounts.map(discount => `
                    <tr>
                        <td>${discount.type}</td>
                        <td class="amount">${this.formatAmount(discount.amount)} руб.</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">5. УСЛОВИЯ ОПЛАТЫ</div>
        <p><strong>Первоначальный взнос:</strong> ${this.formatAmount(offer.downPayment)} руб.</p>
        ${offer.installmentMonths && offer.installmentMonths > 1 ? `
        <p><strong>Рассрочка:</strong> ${offer.installmentMonths} месяцев</p>
        <p><strong>Ежемесячный платеж:</strong> ${this.formatAmount(offer.monthlyPayment || 0)} руб.</p>
        ` : '<p><strong>Оплата:</strong> Полная оплата при заключении договора</p>'}
        ${offer.usedCertificate ? '<p><strong>Применён сертификат:</strong> Да</p>' : ''}
    </div>

    <div class="section">
        <div class="section-title">6. ГРАФИК ПЛАТЕЖЕЙ</div>
        <table>
            <thead>
                <tr>
                    <th>№</th>
                    <th>Дата платежа</th>
                    <th>Сумма платежа</th>
                    <th>Описание</th>
                </tr>
            </thead>
            <tbody>
                ${paymentSchedule.map((payment, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${payment.date}</td>
                        <td class="amount">${this.formatAmount(payment.amount)} руб.</td>
                        <td>${payment.description}</td>
                    </tr>
                `).join('')}
                <tr class="total">
                    <td colspan="2"><strong>ИТОГО:</strong></td>
                    <td class="amount"><strong>${this.formatAmount(offer.finalCost)} руб.</strong></td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">7. ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ</div>
        <p>• Срок действия абонемента: 12 месяцев с момента заключения договора</p>
        <p>• Услуги предоставляются по предварительной записи</p>
        <p>• Абонемент не подлежит передаче третьим лицам</p>
        <p>• При досрочном расторжении договора возврат денежных средств не производится</p>
        ${offer.selectedPackage === 'vip' ? '<p>• Возможность заморозки абонемента без ограничений</p>' : ''}
        ${offer.selectedPackage === 'standard' ? '<p>• Возможность заморозки абонемента до 3 месяцев</p>' : ''}
    </div>

    <div class="signature-section">
        <div class="signature-block">
            <p><strong>ИСПОЛНИТЕЛЬ:</strong></p>
            <p>ИП Шейкина Л.С.</p>
            <div class="signature-line"></div>
            <p style="font-size: 10pt;">подпись</p>
        </div>
        <div class="signature-block">
            <p><strong>КЛИЕНТ:</strong></p>
            <p>${offer.clientName || '____________________'}</p>
            <div class="signature-line"></div>
            <p style="font-size: 10pt;">подпись</p>
        </div>
    </div>

    <div class="footer">
        <p>Настоящее Приложение №1 является неотъемлемой частью договора-оферты на оказание услуг по системе абонементов в студиях аппаратной косметологии «Виви».</p>
        <p>Полный текст договора-оферты размещён на сайте: <strong>vivilaser.ru</strong></p>
        <p>Контакты для связи: +7 (969) 777-14-85, WhatsApp: +7 (999) 626-34-75</p>
    </div>
</body>
</html>
    `;
  }

  private getPackageName(packageType: string): string {
    switch (packageType) {
      case 'vip': return 'VIP (максимальная скидка)';
      case 'standard': return 'Стандарт (средняя скидка)';
      case 'economy': return 'Эконом (базовая скидка)';
      default: return packageType;
    }
  }

  private formatAmount(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ru-RU').format(num);
  }
}

export const pdfGenerator = new PDFGenerator();