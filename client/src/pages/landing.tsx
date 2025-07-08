import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Zap, Shield, ArrowRight } from "lucide-react";

export default function Landing() {
  const handleLogin = async () => {
    console.log('Login button clicked - redirecting to /api/login');
    try {
      // Force a full page navigation to the login endpoint
      window.location.replace('/api/login');
    } catch (error) {
      console.error('Login redirect failed:', error);
      // Fallback: try direct navigation
      window.location.href = '/api/login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to Baron
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your intelligent email assistant that automatically organizes your Gmail into 
            FYI, Draft, and Forward categories. Take control of your inbox today.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Smart Categorization</CardTitle>
              <CardDescription>
                Automatically sorts your emails into FYI (informational), 
                Draft (action required), and Forward (to share) categories.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Real-time email processing with instant updates. 
                See your categorized emails as soon as they arrive.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Uses Google OAuth for secure authentication. 
                Your email data stays private and secure.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-lg mx-auto border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Sign in with your Google account to connect your Gmail and start organizing your emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLogin}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 dark:text-gray-400">
          <p>Secure • Private • Intelligent Email Management</p>
        </div>
      </div>
    </div>
  );
}