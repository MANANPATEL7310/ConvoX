import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner } from "sonner";
import { useTheme } from "../../contexts/ThemeContext";

const Toaster = ({
  ...props
}) => {
  const { dark } = useTheme();

  return (
    <Sonner
      theme={dark ? "dark" : "light"}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        /* ── High-contrast styling ── */
        style: {
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: dark
            ? '0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)'
            : '0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        },
        classNames: {
          toast: dark
            ? 'bg-gray-800 text-white border-white/10'
            : 'bg-white text-gray-900 border-gray-200',
          title: dark ? 'text-white font-semibold' : 'text-gray-900 font-semibold',
          description: dark ? 'text-gray-300' : 'text-gray-500',
          success: dark
            ? 'bg-emerald-900/80 text-emerald-100 border-emerald-500/30'
            : 'bg-emerald-50 text-emerald-900 border-emerald-200',
          error: dark
            ? 'bg-red-900/80 text-red-100 border-red-500/30'
            : 'bg-red-50 text-red-900 border-red-200',
          warning: dark
            ? 'bg-amber-900/80 text-amber-100 border-amber-500/30'
            : 'bg-amber-50 text-amber-900 border-amber-200',
          info: dark
            ? 'bg-blue-900/80 text-blue-100 border-blue-500/30'
            : 'bg-blue-50 text-blue-900 border-blue-200',
        },
      }}
      {...props}
    />
  );
}

export { Toaster }
