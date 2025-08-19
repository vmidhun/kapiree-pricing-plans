import { Button } from "@/components/ui/button";
import { Video, Users, Shield } from "lucide-react";

export const PricingHero = () => {
  return (
    <section className="py-20 px-6 text-center bg-gradient-subtle">
      <div className="max-w-4xl mx-auto animate-fade-up">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 bg-gradient-primary text-white px-6 py-3 rounded-full shadow-lg">
            <Video className="w-6 h-6" />
            <span className="font-semibold">Kapiree Video Interviews</span>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Professional Video
          </span>
          <br />
          <span className="text-foreground">Interview Platform</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Streamline your hiring process with AI-powered video interviews. 
          Record, review, and evaluate candidates with confidence.
        </p>
        
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <div className="flex items-center gap-3 text-foreground">
            <Video className="w-5 h-5 text-primary" />
            <span>HD Video Recording</span>
          </div>
          <div className="flex items-center gap-3 text-foreground">
            <Users className="w-5 h-5 text-primary" />
            <span>Team Collaboration</span>
          </div>
          <div className="flex items-center gap-3 text-foreground">
            <Shield className="w-5 h-5 text-primary" />
            <span>Secure Storage</span>
          </div>
        </div>
        
        <Button 
          variant="hero" 
          size="lg"
          className="text-lg px-8 py-4 h-auto animate-scale-in"
        >
          Get Started Today
        </Button>
      </div>
    </section>
  );
};