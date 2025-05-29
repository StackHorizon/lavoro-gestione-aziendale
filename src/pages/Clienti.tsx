
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, LogOut, Trash2, FileText, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Cliente {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  cellulare: string;
}

const Clienti = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [clienti, setClienti] = useState<Cliente[]>([
    { id: '1', nome: 'Mario', cognome: 'Rossi', email: 'mario.rossi@email.it', cellulare: '333-1234567' },
    { id: '2', nome: 'Giuseppe', cognome: 'Verdi', email: 'giuseppe.verdi@email.it', cellulare: '334-2345678' },
    { id: '3', nome: 'Anna', cognome: 'Bianchi', email: 'anna.bianchi@email.it', cellulare: '335-3456789' }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    cellulare: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddCliente = () => {
    setEditingCliente(null);
    setFormData({ nome: '', cognome: '', email: '', cellulare: '' });
    setIsDialogOpen(true);
  };

  const handleEditCliente = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      cognome: cliente.cognome,
      email: cliente.email,
      cellulare: cliente.cellulare
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCliente) {
      setClienti(clienti.map(c => 
        c.id === editingCliente.id 
          ? { ...editingCliente, ...formData }
          : c
      ));
      toast({ title: "Cliente aggiornato con successo!" });
    } else {
      const newCliente: Cliente = {
        id: Date.now().toString(),
        ...formData
      };
      setClienti([...clienti, newCliente]);
      toast({ title: "Cliente aggiunto con successo!" });
    }
    
    setIsDialogOpen(false);
    setFormData({ nome: '', cognome: '', email: '', cellulare: '' });
  };

  const handleDeleteCliente = (id: string) => {
    setClienti(clienti.filter(c => c.id !== id));
    toast({ title: "Cliente eliminato con successo!" });
  };

  const handleGeneratePDF = (cliente: Cliente) => {
    toast({ title: `PDF generato per ${cliente.nome} ${cliente.cognome}` });
  };

  const handleClienteClick = (clienteId: string) => {
    navigate(`/lavori/${clienteId}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Gestione Clienti</h1>
            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Elenco Clienti</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddCliente} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Aggiungi Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({...formData, nome: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cognome">Cognome</Label>
                        <Input
                          id="cognome"
                          value={formData.cognome}
                          onChange={(e) => setFormData({...formData, cognome: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cellulare">Cellulare</Label>
                      <Input
                        id="cellulare"
                        value={formData.cellulare}
                        onChange={(e) => setFormData({...formData, cellulare: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annulla
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {editingCliente ? 'Aggiorna' : 'Aggiungi'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cellulare</TableHead>
                  <TableHead className="text-center">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clienti.map((cliente) => (
                  <TableRow 
                    key={cliente.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleClienteClick(cliente.id)}
                  >
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.cognome}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.cellulare}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCliente(cliente)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGeneratePDF(cliente)}
                          className="h-8 w-8 p-0"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCliente(cliente.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Clienti;
