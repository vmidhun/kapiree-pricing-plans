import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // Re-add Button import
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const navigate = useNavigate();

  const handleNavigateToLogin = () => {
    onClose(); // Close the modal if it's open
    navigate("/signin"); // Navigate to the dedicated login page
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="text-center p-4">
          <h3 className="text-lg font-semibold mb-4">Authentication Required</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Please sign in or create an account to continue.
          </p>
          <div className="flex flex-col space-y-2">
            <Button onClick={handleNavigateToLogin}>
              Go to Sign In / Sign Up
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
