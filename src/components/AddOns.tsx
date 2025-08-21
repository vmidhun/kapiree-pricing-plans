import { Button } from "@/components/ui/button";
import { HardDrive, Users } from "lucide-react";

export const AddOns = () => {
  const addOns = [
    {
      icon: HardDrive,
      title: "Extra Storage",
      price: "$5/month",
      description: "Additional 6 months storage per interview",
      features: [
        "Extend storage beyond 6 months",
        "Per interview basis",
        "Cancel anytime",
        "Secure cloud storage"
      ]
    },
    {
      icon: Users,
      title: "Team Access",
      price: "$15/month",
      description: "Up to 3 additional recruiters/interviewers",
      features: [
        "3 additional team members",
        "Shared interview access",
        "Collaborative notes",
        "Team management tools"
      ]
    }
  ];

  return (
    <section className="py-12 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Add-Ons
            </span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {addOns.map((addOn, index) => (
            <div 
              key={index}
              className="p-8 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <addOn.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{addOn.title}</h3>
                  <p className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {addOn.price}
                  </p>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6">{addOn.description}</p>
              
              <ul className="space-y-3 mb-8">
                {addOn.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};