# PossiNotify Customer Dashboard

A comprehensive Next.js dashboard for PossiNotify customers to manage API keys, monitor usage, send SMS, and manage their account.

## Features

- 🔐 **Authentication**: Secure login with JWT tokens
- 🔑 **API Key Management**: Create, view, and revoke API keys
- 📊 **Usage Analytics**: Monitor usage with interactive charts
- 📱 **SMS Testing**: Send single and bulk SMS messages
- 🎨 **Dark Theme**: Modern dark-themed UI for better readability
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PossiNotify API backend running on `http://localhost:3000`

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd possi_notify_ui
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PossiNotify Dashboard

# Paystack Configuration (for payment processing)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   │   └── login/         # Login page
│   ├── (dashboard)/       # Dashboard pages
│   │   ├── dashboard/     # Main dashboard
│   │   ├── api-keys/      # API keys management
│   │   ├── usage/         # Usage analytics
│   │   ├── sms/           # SMS testing
│   │   ├── billing/       # Billing (placeholder)
│   │   └── settings/      # Settings (placeholder)
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Shadcn/ui components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── api.ts           # API configuration
│   └── services/        # API service classes
├── stores/              # Zustand state stores
└── types/               # TypeScript type definitions
```

## API Integration

The dashboard integrates with the PossiNotify API with the following endpoints:

### Authentication
- `POST /api/v1/auth/login` - Customer login
- `POST /admin/api/v1/customers` - Customer registration (admin)

### API Key Management
- `GET /api/v1/api_keys` - List API keys
- `POST /api/v1/api_keys` - Create API key
- `DELETE /api/v1/api_keys/:id` - Revoke API key

### SMS Management
- `POST /api/v1/sms/send` - Send single SMS
- `POST /api/v1/sms/bulk` - Send bulk SMS
- `GET /api/v1/sms` - List SMS messages

### Payment Processing
- **Paystack Integration**: Secure payment processing for credit top-ups (GHS currency)
- **Payment Flow**: 
  1. User enters credit amount
  2. Paystack payment modal opens
  3. Payment is processed securely in Ghanaian Cedi (₵)
  4. On successful payment, credits are added to account
  5. On failed payment, no credits are added

## Paystack Integration

The application integrates Paystack for secure payment processing:

### Setup
1. Get your Paystack API keys from [Paystack Dashboard](https://dashboard.paystack.com/)
2. Add the keys to your `.env.local` file:
   ```
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
   PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
   ```

### Features
- **Secure Payment**: All payments are processed through Paystack's secure infrastructure
- **Payment Verification**: Payments are verified before credits are added
- **User-Friendly**: Simple payment flow with clear feedback
- **Error Handling**: Graceful handling of payment failures and cancellations

### Usage Analytics
- `GET /api/v1/usage/current` - Current month usage
- `GET /api/v1/usage/history` - Usage history

## Key Features

### Dashboard Overview
- Real-time usage statistics
- Monthly limit tracking
- Quick action buttons
- Usage breakdown by service

### API Key Management
- Create new API keys with custom names
- View key prefixes and usage history
- Revoke keys with confirmation
- Secure key generation (shown only once)

### SMS Testing
- Send single SMS with validation
- Bulk SMS with recipient list
- Character count and SMS calculation
- Real-time status feedback

### Usage Analytics
- Interactive line charts for usage over time
- Bar charts for service breakdown
- Recent API calls with status codes
- Cost tracking and analysis

## Authentication Flow

1. Users visit the dashboard
2. If not authenticated, redirected to login
3. After successful login, JWT token stored in localStorage
4. Token automatically included in API requests
5. 401 responses trigger automatic logout

## State Management

The app uses Zustand for state management with two main stores:

- **AuthStore**: Manages authentication state and user data
- **UsageStore**: Manages usage data and analytics

## Styling

The dashboard uses a dark theme throughout with:
- Dark backgrounds (`bg-gray-800`, `bg-gray-900`)
- Light text (`text-white`, `text-gray-300`)
- Blue accents (`bg-blue-600`, `text-blue-400`)
- Consistent spacing and typography

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Pages

1. Create a new directory in `src/app/(dashboard)/`
2. Add a `page.tsx` file
3. Update the navigation in `src/components/layout/Sidebar.tsx`

### Adding New API Services

1. Create a new service file in `src/lib/services/`
2. Import and use the `api` instance from `src/lib/api.ts`
3. Add TypeScript types in `src/types/index.ts`

## Deployment

The dashboard can be deployed to any platform that supports Next.js:

- **Vercel**: Recommended for Next.js apps
- **Netlify**: Static site deployment
- **Railway**: Full-stack deployment
- **Docker**: Containerized deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the PossiNotify team.
