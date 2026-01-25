import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Park Management | Admin | DealForge',
  description: 'Manage mobile home park records',
};

export default function ParksManagementPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Park Management</h1>
        <p className="text-muted-foreground">Edit, merge, and manage mobile home park records.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parks List</CardTitle>
          <CardDescription>View and manage all discovered parks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>Park management interface coming soon...</p>
            <p className="mt-2">Features planned:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Edit park details (name, lot count, etc.)</li>
              <li>Merge duplicate park records</li>
              <li>Mark parks as verified/reviewed</li>
              <li>Bulk actions for park management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
