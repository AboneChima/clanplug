export const dynamic = 'force-static';

type ActivityItem = {
  icon: string;
  label: string;
  text: string;
  time: string;
};

export async function GET() {
  const data: ActivityItem[] = [
    { icon: 'wallet', label: 'Wallet', text: 'Connected wallet placeholder', time: 'Just now' },
    { icon: 'account', label: 'Account', text: 'Registered and verified email', time: '2h ago' },
    { icon: 'transaction', label: 'Transaction', text: 'Escrow flow will appear here', time: 'Yesterday' },
  ];
  return Response.json(data);
}