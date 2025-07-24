'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Database, Trash2, Edit, PlusCircle, KeyRound, Flame } from "lucide-react";
import { TestDbConnectionButton } from "@/components/shared/test-db-connection-button";
import { TestSonner } from "@/components/shared/test-sonner";

// --- INTERFACES & API ---
interface DbConfig { id: string; config_name: string; db_type: string; host: string; username: string; database_name: string; }
interface DbConfigCreate { config_name: string; db_type: string; host: string; port: number; username: string; database_name: string; password: string; }
interface Credential { id: string; credential_name: string; }

const API_URL = 'http://127.0.0.1:8000/api';
const getDbConfigs = async (): Promise<DbConfig[]> => (await axios.get(`${API_URL}/database-configs`)).data;
const createDbConfig = async (configData: DbConfigCreate) => (await axios.post(`${API_URL}/database-configs`, configData)).data;
const testDbConfig = async (configData: DbConfigCreate) => (await axios.post(`${API_URL}/database-configs/test`, configData)).data;
const getCredentials = async (): Promise<Credential[]> => (await axios.get(`${API_URL}/credentials`)).data;
const createCredential = async (data: { credential_name: string; value: string }) => (await axios.post(`${API_URL}/credentials`, data)).data;
const deleteCredential = async (id: string) => (await axios.delete(`${API_URL}/credentials/${id}`)).data;

type AddNewConnectionFormProps = {
  onSave: (data: DbConfigCreate) => void;
  onCancel: () => void;
};

const AddNewConnectionForm: React.FC<AddNewConnectionFormProps> = ({ onSave, onCancel }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<DbConfigCreate>({ config_name: '', db_type: 'PostgreSQL', host: '', port: 5432, username: '', database_name: '', password: '' });

  const testMutation = useMutation({
    mutationFn: testDbConfig,
    onSuccess: () => { toast({ title: "Success!", description: "Connection tested successfully." }); },
    onError: (error: AxiosError) => { toast({ variant: "destructive", title: "Connection Failed", description: (error.response?.data as any)?.detail || "An error occurred." }); },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'port' ? parseInt(value) || 0 : value }));
  };

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Configure PostgreSQL Connection</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key} className={key === 'db_type' ? 'hidden' : ''}>
            <Label htmlFor={key} className="capitalize">{key.replace('_', ' ')}</Label>
            <Input id={key} name={key} value={value} onChange={handleInputChange} type={key === 'password' ? 'password' : (key === 'port' ? 'number' : 'text')} className="mt-1" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => testMutation.mutate(formData)} disabled={testMutation.isPending}>{testMutation.isPending ? 'Testing...' : 'Test Connection'}</Button>
        <Button onClick={() => onSave(formData)} disabled={testMutation.isPending}>Save Connection</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

const availableIntegrations = [
  { name: "SendGrid", description: "Use SendGrid for sending emails via workflows.", icon: KeyRound },
  { name: "OpenAI", description: "Connect your OpenAI account for advanced AI features.", icon: KeyRound },
  { name: "Firebase", description: "Connect to Firestore for data operations.", icon: Flame },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDbFormVisible, setIsDbFormVisible] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [currentCredential, setCurrentCredential] = useState<{name: string} | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState("");

  // --- DATA QUERIES ---
  const { data: dbConfigs, isLoading: isLoadingDbConfigs, isError: isErrorDbConfigs } = useQuery<DbConfig[], Error>({ queryKey: ['dbConfigs'], queryFn: getDbConfigs });
  const { data: credentials, isLoading: isLoadingCredentials } = useQuery<Credential[], Error>({ queryKey: ['credentials'], queryFn: getCredentials });

  // --- MUTATIONS ---
  const dbCreateMutation = useMutation({
    mutationFn: createDbConfig,
    onSuccess: () => {
      toast({ title: "Connection Saved!" });
      queryClient.invalidateQueries({ queryKey: ['dbConfigs'] });
      setIsDbFormVisible(false);
    },
    onError: (error: AxiosError) => { toast({ variant: "destructive", title: "Save Failed", description: (error.response?.data as any)?.detail || "An error occurred." }); },
  });

  const credentialCreateMutation = useMutation({
    mutationFn: createCredential,
    onSuccess: () => {
      toast({ title: "Integration Connected!" });
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setIsCredentialModalOpen(false);
      setApiKeyValue("");
      setCurrentCredential(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not save credential." });
    }
  });

  const credentialDeleteMutation = useMutation({
    mutationFn: deleteCredential,
    onSuccess: () => {
      toast({ title: "Integration Disconnected" });
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not disconnect integration." });
    }
  });

  const handleConnectClick = (integrationName: string) => {
    setCurrentCredential({ name: integrationName });
    setIsCredentialModalOpen(true);
  };

  const handleSaveCredential = () => {
    if (currentCredential && apiKeyValue.trim()) {
      credentialCreateMutation.mutate({ credential_name: currentCredential.name, value: apiKeyValue.trim() });
    }
  };

  const handleCloseModal = () => {
    setIsCredentialModalOpen(false);
    setApiKeyValue("");
    setCurrentCredential(null);
  };

  const isCredentialConnected = (name: string) => credentials?.some(c => c.credential_name === name);
  const getCredentialId = (name: string) => credentials?.find(c => c.credential_name === name)?.id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage integrations and database connections for your workflows.</p>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Test Sonner Integration</h3>
          <TestSonner />
        </div>
      </div>

      {/* --- INTEGRATIONS & CREDENTIALS CARD --- */}
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Integrations & Credentials</CardTitle>
          <CardDescription>Connect FiCX with third-party services by providing API keys.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableIntegrations.map((integration) => {
            const isConnected = isCredentialConnected(integration.name);
            const credentialId = getCredentialId(integration.name);
            return (
              <div key={integration.name} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <integration.icon className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{integration.name}</p>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isConnected ? "✓ Connected" : "Not Connected"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {isConnected ? (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => credentialId && credentialDeleteMutation.mutate(credentialId)}
                      disabled={credentialDeleteMutation.isPending}
                    >
                      {credentialDeleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect"}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleConnectClick(integration.name)}>
                      Connect
                    </Button>
                  )}
          </div>
          </div>
            );
          })}
        </CardContent>
      </Card>

      {/* --- DATABASE CONFIGURATIONS CARD --- */}
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Database Configurations</CardTitle>
          <CardDescription>Connect to your external databases for the 'Run SQL' workflow node.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isDbFormVisible ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Add New Database Connection</h3>
              <Button onClick={() => setIsDbFormVisible(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />Configure PostgreSQL
              </Button>
            </div>
          ) : (
            <AddNewConnectionForm 
              onSave={(data) => dbCreateMutation.mutate(data)} 
              onCancel={() => setIsDbFormVisible(false)} 
            />
          )}
          <div className="border-t mt-6 pt-6">
            <h3 className="text-lg font-semibold mb-4">Existing Connections</h3>
            {isLoadingDbConfigs ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading connections...</span>
              </div>
            ) : isErrorDbConfigs ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Error loading connections.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {dbConfigs && dbConfigs.length > 0 ? dbConfigs.map((config) => (
                  <div key={config.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">{config.config_name}</p>
                      <p className="text-sm text-muted-foreground">{config.db_type} &middot; {config.host}</p>
                    </div>
                    <div className="flex gap-2">
                      <TestDbConnectionButton configId={config.id} />
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />Edit
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                      </Button>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No connections configured yet.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* --- GENERAL SETTINGS CARD --- */}
       <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Application-wide preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Theme preferences (Light/Dark mode), notification settings, and other general options will be available here.</p>
        </CardContent>
      </Card>

      {/* --- MODAL FOR API KEY --- */}
      <Dialog open={isCredentialModalOpen} onOpenChange={setIsCredentialModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {currentCredential?.name}</DialogTitle>
            <DialogDescription>
              Paste your API key below to connect the service. Your key will be encrypted and stored securely.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="credentialValue">
              {currentCredential?.name === 'Firebase' ? 'Service Account JSON Key' : 'API Key'}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {currentCredential?.name === 'Firebase' ? 'Paste the entire content of your service account JSON file.' : 'Paste your secret API key.'}
            </p>
            {currentCredential?.name === 'Firebase' ? (
              <Textarea
                id="credentialValue"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                rows={10}
                className="font-mono mt-2 bg-background"
                placeholder='{ "type": "service_account", ... }'
              />
            ) : (
              <Input
                id="credentialValue"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                type="password"
                className="mt-2 bg-background"
              />
            )}
            {currentCredential?.name === 'SendGrid' && (
              <p className="text-xs text-muted-foreground mt-2">
                Your SendGrid API key should start with "SG." and have at least "Mail Send" permissions.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button 
              onClick={handleSaveCredential} 
              disabled={credentialCreateMutation.isPending || !apiKeyValue.trim()}
            >
              {credentialCreateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Save & Connect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
