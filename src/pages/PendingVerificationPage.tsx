import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, CheckCircle, XCircle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingVerificationPage() {
  const { user, profile, signOut } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/20 text-success';
      case 'rejected': return 'bg-destructive/20 text-destructive';
      default: return 'bg-warning/20 text-warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5" />;
      case 'rejected': return <XCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return "Your account is currently being reviewed by our admin team. This process typically takes 1-2 business days. You'll receive an email notification once your account is approved.";
      case 'rejected':
        return "Unfortunately, your account verification was not approved. Please contact our support team if you believe this was an error or if you'd like to appeal this decision.";
      default:
        return "There was an issue with your account verification status. Please contact support for assistance.";
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-gradient-primary rounded-lg p-2">
              <div className="h-6 w-6 bg-primary-foreground rounded-sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">StoxOne</span>
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                Pro
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Account Verification</h1>
          <p className="text-muted-foreground">
            Welcome {profile.full_name}! Your account verification is in progress.
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-2">
              {getStatusIcon(profile.verification_status)}
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              Verification Status:
              <Badge className={getStatusColor(profile.verification_status)}>
                {profile.verification_status.charAt(0).toUpperCase() + profile.verification_status.slice(1)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Account created on {new Date(profile.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {getStatusMessage(profile.verification_status)}
            </p>

            {profile.verification_notes && (
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Admin Notes:</h4>
                <p className="text-sm text-muted-foreground">
                  {profile.verification_notes}
                </p>
              </div>
            )}

            {profile.verification_date && (
              <div className="text-center text-sm text-muted-foreground">
                {profile.verification_status === 'approved' ? 'Approved' : 'Updated'} on{' '}
                {new Date(profile.verification_date).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={() => window.location.reload()}
          >
            Refresh Status
          </Button>
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}