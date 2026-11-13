# Finanzas — demo

A personal finance dashboard: salary, credit cards, a loan and household bills, month by month.
This is a public copy with **made-up data**. The interface is in Spanish (Uruguay).

The real version is private. A scheduled pipeline downloads payslips and card and bank
statements, extracts the numbers from the PDFs, checks every document against its own totals,
emails a monthly report and sends the data to this dashboard. Here, the 30 months shown come
from a generator ([`lib/datos-demo.ts`](lib/datos-demo.ts)), so there is no database, no login
and nothing is saved.

## What's in it

- **Resumen**: what came in, what's left after fixed costs and cards, and where the rest went.
- **Ingresos, Gastos, Tarjetas, Préstamo, Cuentas de la casa**: one page per topic, with
  12-month charts and month-over-month comparisons.
- **Préstamo**: a loan in Unidades Indexadas (an inflation-indexed unit), with the balance,
  interest vs. principal by year and the net cost after rent received.
- **A report for every month**, with each card's transactions and pending instalments.
- **Configuración**: the two rents (received and paid), valid from a chosen month. In the demo
  the form validates but doesn't save.
- Light and dark themes. The chart colors were checked for color blindness.

## Stack

Next.js 16 (App Router, Server Components), React 19, TypeScript, Tailwind CSS 4 and Recharts.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
```

---

Hecho por [Martín Arregui](https://www.linkedin.com/in/martin-arregui/).
