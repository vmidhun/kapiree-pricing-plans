import { Clock, Download, Archive, DollarSign } from "lucide-react";

export const StoragePolicy = () => {
  const policies = [
    {
      icon: Clock,
      title: "6 Months Storage",
      description: "All video interviews are stored securely for 6 months included in your subscription.",
    },
    {
      icon: Download,
      title: "Download Anytime",
      description: "Download your interview videos at any time before expiration for permanent storage.",
    },
    {
      icon: Archive,
      title: "Auto-Deletion",
      description: "Videos older than 6 months are automatically deleted to maintain your privacy.",
    },
    {
      icon: DollarSign,
      title: "Extended Storage",
      description: "Need longer storage? Add $5/month per additional 6 months per interview.",
    },
  ];

  return (
    <section className="py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Storage Policy
            </span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {policies.map((policy, index) => (
            <div 
              key={index}
              className="text-center p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
                <policy.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                {policy.title}
              </h3>
              <p className="text-muted-foreground">
                {policy.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};