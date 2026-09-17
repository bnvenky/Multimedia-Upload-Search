import Logo from './Logo';

const SplashScreen = () => (
  <div role="status" aria-label="Loading" className="fixed inset-0 grid place-content-center justify-items-center gap-5 bg-canvas">
    <Logo />
    <div className="relative h-[3px] w-35 overflow-hidden rounded-full bg-surface-2">
      <div className="absolute inset-y-0 w-2/5 animate-loading rounded-full bg-brand" />
    </div>
  </div>
);

export default SplashScreen;
