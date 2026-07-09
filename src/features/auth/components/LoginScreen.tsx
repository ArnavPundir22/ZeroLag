import { SignIn } from '@clerk/react';
import { Activity } from 'lucide-react';

export const LoginScreen = () => {
  return (
    <div className="h-screen w-screen flex bg-background">
      {/* Left Panel: Graphic / Value Prop */}
      <div className="hidden lg:flex flex-1 relative bg-surface overflow-hidden">
        {/* Abstract shapes / gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex flex-col justify-center h-full p-20 text-text-primary">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/30">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">ZeroLag</h1>
          </div>
          <h2 className="text-6xl font-bold mb-6 leading-tight">
            Offline-first.<br/>
            Real-time sync.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">Zero compromises.</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-lg mt-4">
            Manage your tasks seamlessly without ever worrying about loading spinners or lost connections. Work fully offline and magically sync when you're back.
          </p>
        </div>
      </div>

      {/* Right Panel: Auth */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 relative z-10 bg-background/50 backdrop-blur-2xl">
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">ZeroLag</h1>
        </div>
        
        <div className="w-full max-w-[400px]">
          <SignIn 
            routing="hash" 
            fallbackRedirectUrl="/" 
            signUpFallbackRedirectUrl="/"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-surface border border-border shadow-2xl rounded-2xl w-full p-8",
                headerTitle: "text-text-primary text-2xl font-bold",
                headerSubtitle: "text-text-secondary",
                socialButtonsBlockButton: "bg-surface-hover border border-border hover:bg-surface-hover/80 text-text-primary h-11",
                socialButtonsBlockButtonText: "text-text-primary font-medium",
                dividerLine: "bg-border",
                dividerText: "text-text-secondary",
                formFieldLabel: "text-text-primary font-medium",
                formFieldInput: "bg-background border-border text-text-primary focus:border-accent focus:ring-1 focus:ring-accent h-11",
                formButtonPrimary: "bg-accent hover:bg-accent/90 text-white font-medium h-11 text-base shadow-lg shadow-accent/20",
                footerActionText: "text-text-secondary",
                footerActionLink: "text-accent hover:text-accent/80 font-medium"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
