type Props = {
  show: boolean;
  message?: string;
};

export default function Banner({ show, message }: Props) {
  if (!show) return null;
  return (
    <div className="w-full bg-red-600 text-white p-3 text-sm text-center" role="alert" aria-live="polite">
      {message ?? 'API key or Firebase configuration is incomplete. Please set environment variables referring to .env.example.'}
    </div>
  );
}
