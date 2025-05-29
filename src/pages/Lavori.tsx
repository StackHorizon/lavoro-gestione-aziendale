
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Lavoro {
  id: string;
  clienteId: string;
  titolo: string;
  descrizione: string;
  stato: 'in_corso' | 'completato' | 'sospeso' | 'annullato';
}

const Lavori = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { clienteId } = useParams();
  const [lavori, setLavori] = useState<Lavoro[]>([
    { id: '1', clienteId: '1', titolo: 'Ristrutturazione Bagno', descrizione: 'Rifacimento completo bagno principale', stato: 'in_corso' },
    { id: '2', clienteId: '1', titolo: 'Tinteggiatura Soggiorno', descrizione: 'Tinteggiatura pareti soggiorno e cucina', stato: 'completato' },
    { id: '3', clienteId: '2', titolo: 'Impianto Elettrico', descrizione: 'Rifacimento impianto elettrico appartamento', stato: 'in_corso' }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLavoro, setEditingLavoro] = useState<Lavoro | null>(null);
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    stato: 'in_corso' as Lavoro['stato']
  });

  const clienteLavori = lavori.filter(l => l.clienteId === clienteId);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleBack = () => {
    navigate('/clienti');
  };

  const handleAddLavoro = () => {
    setEditingLavoro(null);
    setFormData({ titolo: '', descrizione: '', stato: 'in_corso' });
    setIsDialogOpen(true);
  };

  const handleEditLavoro = (lavoro: Lavoro) => {
    setEditingLavoro(lavoro);
    setFormData({
      titolo: lavoro.titolo,
      descrizione: lavoro.descrizione,
      stato: lavoro.stato
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingLavoro) {
      setLavori(lavori.map(l => 
        l.id === editingLavoro.id 
          ? { ...editingLavoro, ...formData }
          : l
      ));
      toast({ title: "Lavoro aggiornato con successo!" });
    } else {
      const newLavoro: Lavoro = {
        id: Date.now().toString(),
        clienteId: clienteId!,
        ...formData
      };
      setLavori([...lavori, newLavoro]);
      toast({ title: "Lavoro aggiunto con successo!" });
    }
    
    setIsDialogOpen(false);
    setFormData({ titolo: '', descrizione: '', stato: 'in_corso' });
  };

  const handleDeleteLavoro = (id: string) => {
    setLavori(lavori.filter(l => l.id !== id));
    toast({ title: "Lavoro eliminato con successo!" });
  };

  const handleLavoroClick = (lavoroId: string) => {
    navigate(`/pagamenti/${lavoroId}`);
  };

  const getStatoColor = (stato: Lavoro['stato']) => {
    switch (stato) {
      case 'completato': return 'text-green-600 bg-green-100';
      case 'in_corso': return 'text-blue-600 bg-blue-100';
      case 'sospeso': return 'text-yellow-600 bg-yellow-100';
      case 'annullato': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatoLabel = (stato: Lavoro['stato']) => {
    switch (stato) {
      case 'completato': return 'Completato';
      case 'in_corso': return 'In Corso';
      case 'sospeso': return 'Sospeso';
      case 'annullato': return 'Annullato';
      default: return stato;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button onClick={handleBack} variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Torna ai Clienti
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Gestione Lavori</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Elenco Lavori</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddLavoro} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Aggiungi Lavoro
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLavoro ? 'Modifica Lavoro' : 'Nuovo Lavoro'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="titolo">Titolo</Label>
                      <Input
                        id="titolo"
                        value={formData.titolo}
                        onChange={(e) => setFormData({...formData, titolo: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="descrizione">Descrizione</Label>
                      <Textarea
                        id="descrizione"
                        value={formData.descrizione}
                        onChange={(e) => setFormData({...formData, descrizione: e.target.value})}
                        required
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stato">Stato</Label>
                      <Select value={formData.stato} onValueChange={(value: Lavoro['stato']) => setFormData({...formData, stato: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_corso">In Corso</SelectItem>
                          <SelectItem value="completato">Completato</SelectItem>
                          <SelectItem value="sospeso">Sospeso</SelectItem>
                          <SelectItem value="annullato">Annullato</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annulla
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {editingLavoro ? 'Aggiorna' : 'Aggiungi'}
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
                  <TableHead>Titolo</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-center">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clienteLavori.map((lavoro) => (
                  <TableRow 
                    key={lavoro.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleLavoroClick(lavoro.id)}
                  >
                    <TableCell className="font-medium">{lavoro.titolo}</TableCell>
                    <TableCell className="max-w-xs truncate">{lavoro.descrizione}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatoColor(lavoro.stato)}`}>
                        {getStatoLabel(lavoro.stato)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditLavoro(lavoro)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLavoro(lavoro.id)}
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

export default Lavori;
