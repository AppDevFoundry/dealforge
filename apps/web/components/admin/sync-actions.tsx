'use client';

import { Calculator, CloudUpload, Loader2, MapPin } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ActionType = 'upload' | 'discover' | 'calculate';

interface ActionState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export function SyncActions() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'titles' | 'liens'>('titles');
  const [actionStates, setActionStates] = useState<Record<ActionType, ActionState>>({
    upload: { isLoading: false, error: null, success: null },
    discover: { isLoading: false, error: null, success: null },
    calculate: { isLoading: false, error: null, success: null },
  });

  const setActionState = useCallback((action: ActionType, state: Partial<ActionState>) => {
    setActionStates((prev) => ({
      ...prev,
      [action]: { ...prev[action], ...state },
    }));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect file type from filename
      if (file.name.toLowerCase().includes('ttl') || file.name.toLowerCase().includes('title')) {
        setFileType('titles');
      } else if (
        file.name.toLowerCase().includes('tax') ||
        file.name.toLowerCase().includes('lien')
      ) {
        setFileType('liens');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setActionState('upload', { isLoading: true, error: null, success: null });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', fileType);

      const response = await fetch('/api/v1/admin/sync/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      setActionState('upload', {
        isLoading: false,
        success: `Job created: ${result.data?.jobId || 'success'}`,
      });
      setSelectedFile(null);
    } catch (err) {
      setActionState('upload', {
        isLoading: false,
        error: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  };

  const handleAction = async (action: 'discover' | 'calculate') => {
    setActionState(action, { isLoading: true, error: null, success: null });

    try {
      const response = await fetch('/api/v1/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: action === 'discover' ? 'discover_parks' : 'calculate_distress',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Action failed');
      }

      const result = await response.json();
      setActionState(action, {
        isLoading: false,
        success: `Job created: ${result.data?.id || 'success'}`,
      });
    } catch (err) {
      setActionState(action, {
        isLoading: false,
        error: err instanceof Error ? err.message : 'Action failed',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* CSV Upload Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Upload TDHCA CSV</Label>
        <div className="flex gap-2">
          <Input type="file" accept=".csv" onChange={handleFileChange} className="flex-1" />
          <Select value={fileType} onValueChange={(v) => setFileType(v as 'titles' | 'liens')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="titles">Titles</SelectItem>
              <SelectItem value="liens">Liens</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedFile && (
          <p className="text-xs text-muted-foreground">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || actionStates.upload.isLoading}
          className="w-full"
        >
          {actionStates.upload.isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CloudUpload className="mr-2 h-4 w-4" />
          )}
          Upload & Import
        </Button>
        {actionStates.upload.error && (
          <p className="text-xs text-destructive">{actionStates.upload.error}</p>
        )}
        {actionStates.upload.success && (
          <p className="text-xs text-green-600">{actionStates.upload.success}</p>
        )}
      </div>

      <div className="border-t pt-4" />

      {/* Processing Actions */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Processing Actions</Label>

        {/* Discover Parks */}
        <Button
          onClick={() => handleAction('discover')}
          disabled={actionStates.discover.isLoading}
          variant="outline"
          className="w-full justify-start"
        >
          {actionStates.discover.isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="mr-2 h-4 w-4" />
          )}
          Discover Parks from Titles
        </Button>
        {actionStates.discover.error && (
          <p className="text-xs text-destructive">{actionStates.discover.error}</p>
        )}
        {actionStates.discover.success && (
          <p className="text-xs text-green-600">{actionStates.discover.success}</p>
        )}

        {/* Calculate Distress */}
        <Button
          onClick={() => handleAction('calculate')}
          disabled={actionStates.calculate.isLoading}
          variant="outline"
          className="w-full justify-start"
        >
          {actionStates.calculate.isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="mr-2 h-4 w-4" />
          )}
          Calculate Distress Scores
        </Button>
        {actionStates.calculate.error && (
          <p className="text-xs text-destructive">{actionStates.calculate.error}</p>
        )}
        {actionStates.calculate.success && (
          <p className="text-xs text-green-600">{actionStates.calculate.success}</p>
        )}
      </div>
    </div>
  );
}
