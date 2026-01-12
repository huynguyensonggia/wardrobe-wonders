import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Settings() {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-medium">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Manage how you receive updates about your rentals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive rental updates via email
              </p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive rental reminders via text
              </p>
            </div>
            <Switch id="sms-notifications" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketing">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive news about new collections
              </p>
            </div>
            <Switch id="marketing" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>
            Control your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="profile-visibility">Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to see your profile
              </p>
            </div>
            <Switch id="profile-visibility" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
