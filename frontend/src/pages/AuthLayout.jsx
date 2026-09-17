import { FileText, Image, Music, ShieldCheck, Sparkles, Video, Zap } from 'lucide-react';
import Logo from '../components/common/Logo';
import { cn } from '../utils/cn';

const HIGHLIGHTS = [
  { icon: Sparkles, title: 'Smart ranked search', text: 'Typo-tolerant matching across titles, tags and descriptions.' },
  { icon: Zap, title: 'Real-time library', text: 'See new uploads the moment they land.' },
  { icon: ShieldCheck, title: 'Secure by design', text: 'Rotating sessions, verified file types, private files.' },
];

// Floating media icons use the same category colors as the rest of the app.
const FLOATING_ICONS = [
  { icon: Image, className: 'top-[18%] right-[16%] text-[#3987e5]' },
  { icon: Video, className: 'top-[40%] right-[34%] text-[#d95926] [animation-delay:-2s]' },
  { icon: Music, className: 'top-[12%] right-[44%] text-[#199e70] [animation-delay:-4s]' },
  { icon: FileText, className: 'top-[32%] right-[8%] text-[#c98500] [animation-delay:-5.5s]' },
];

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="grid min-h-screen md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
    <section
      aria-hidden
      className="relative hidden flex-col justify-between overflow-hidden bg-[#070812] bg-[radial-gradient(circle_at_15%_20%,rgba(124,92,255,0.35),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,0.25),transparent_45%)] p-10 text-[#eef0fb] md:flex"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] mask-[radial-gradient(circle_at_50%_50%,#000_30%,transparent_75%)] bg-size-[44px_44px]" />

      <div className="relative">
        <Logo />
      </div>

      {FLOATING_ICONS.map(({ icon: Icon, className }) => (
        <span
          key={className}
          className={cn('absolute grid size-14.5 animate-float place-items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md', className)}
        >
          <Icon size={22} />
        </span>
      ))}

      <div className="relative max-w-120">
        <h1 className="mb-7 text-[clamp(2rem,1.4rem+1.8vw,2.8rem)] leading-[1.1] font-bold tracking-tight">
          All your media. <span className="text-brand">Found in a keystroke.</span>
        </h1>
        <ul className="grid gap-4.5">
          {HIGHLIGHTS.map(({ icon: Icon, title: heading, text }) => (
            <li key={heading} className="flex gap-3.5">
              <Icon size={18} className="mt-0.5 shrink-0 text-[#22d3ee]" />
              <div>
                <strong className="font-semibold">{heading}</strong>
                <p className="text-[0.9rem] text-[#a3a8c3]">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section className="grid place-items-center px-4 py-8">
      <div className="w-full max-w-100">
        <div className="mb-7 md:hidden">
          <Logo />
        </div>
        <h1 className="mb-1.5 text-[1.9rem] leading-tight font-bold tracking-tight">{title}</h1>
        <p className="mb-7 text-muted">{subtitle}</p>
        {children}
      </div>
    </section>
  </div>
);

export default AuthLayout;
