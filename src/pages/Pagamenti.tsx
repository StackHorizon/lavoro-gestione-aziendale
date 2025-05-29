
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Pagamento {
  id: string;
  lavoroId: string;
  dataModifica: string;
  importoDovuto: number;
  importoPagato: number;
  causale: string;
}

const Pagamenti = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { lavoroId } = useParams();
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([
    { 
      id: '1', 
      lavoroId: '1', 
      dataModifica: '2024-01-15', 
      importoDovuto: 5000, 
      importoPagato: 2000, 
      causale: 'Acconto materiali'
    },
    { 
      id: '2', 
      lavoroId: '1', 
      dataModifica: '2024-02-01', 
      importoDovuto: 3000, 
      importoPagato: 3000, 
      causale: 'Saldo finale lavori'
    },
    { 
      id: '3', 
      lavoroId: '3', 
      dataModifica: '2024-01-20', 
      importoDovuto: 8000, 
      importoPagato: 4000, 
      causale: 'Prima rata impianto'
    }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState<Pagamento | null>(null);
  const [formData, setFormData] = useState({
    dataModifica: '',
    importoDovuto: '',
    importoPagato: '',
    causale: ''
  });

  const lavoroPagamenti = pagamenti.filter(p => p.lavoroId === lavoroId);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddPagamento = () => {
    setEditingPagamento(null);
    setFormData({ 
      dataModifica: new Date().toISOString().split('T')[0], 
      importoDovuto: '', 
      importoPagato: '', 
      causale: '' 
    });
    setIsDialogOpen(true);
  };

  const handleEditPagamento = (pagamento: Pagamento) => {
    setEditingPagamento(pagamento);
    setFormData({
      dataModifica: pagamento.dataModifica,
      importoDovuto: pagamento.importoDovuto.toString(),
      importoPagato: pagamento.importoPagato.toString(),
      causale: pagamento.causale
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const pagamentoData: Omit<Pagamento, 'id'> = {
      lavoroId: lavoroId!,
      dataModifica: formData.dataModifica,
      importoDovuto: parseFloat(formData.importoDovuto),
      importoPagato: parseFloat(formData.importoPagato),
      causale: formData.causale
    };

    if (editingPagamento) {
      setPagamenti(pagamenti.map(p => 
        p.id === editingPagamento.id 
          ? { ...editingPagamento, ...pagamentoData }
          : p
      ));
      toast({ title: "Pagamento aggiornato con successo!" });
    } else {
      const newPagamento: Pagamento = {
        id: Date.now().toString(),
        ...pagamentoData
      };
      setPagamenti([...pagamenti, newPagamento]);
      toast({ title: "Pagamento aggiunto con successo!" });
    }
    
    setIsDialogOpen(false);
    setFormData({ dataModifica: '', importoDovuto: '', importoPagato: '', causale: '' });
  };

  const handleDeletePagamento = (id: string) => {
    setPagamenti(pagamenti.filter(p => p.id !== id));
    toast({ title: "Pagamento eliminato con successo!" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
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
                Torna Indietro
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Gestione Pagamenti</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Elenco Pagamenti</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddPagamento} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Aggiungi Pagamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPagamento ? 'Modifica Pagamento' : 'Nuovo Pagamento'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="dataModifica">Data Modifica</Label>
                      <Input
                        id="dataModifica"
                        type="date"
                        value={formData.dataModifica}
                        onChange={(e) => setFormData({...formData, dataModifica: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="importoDovuto">Importo Dovuto (€)</Label>
                        <Input
                          id="importoDovuto"
                          type="number"
                          step="0.01"
                          value={formData.importoDovuto}
                          onChange={(e) => setFormData({...formData, importoDovuto: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="importoPagato">Importo Pagato (€)</Label>
                        <Input
                          id="importoPagato"
                          type="number"
                          step="0.01"
                          value={formData.importoPagato}
                          onChange={(e) => setFormData({...formData, importoPagato: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="causale">Causale</Label>
                      <Textarea
                        id="causale"
                        value={formData.causale}
                        onChange={(e) => setFormData({...formData, causale: e.target.value})}
                        required
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annulla
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {editingPagamento ? 'Aggiorna' : 'Aggiungi'}
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
                  <TableHead>Data Modifica</TableHead>
                  <TableHead>Importo Dovuto</TableHead>
                  <TableHead>Importo Pagato</TableHead>
                  <TableHead>Importo Mancante</TableHead>
                  <TableHead>Causale</TableHead>
                  <TableHead className="text-center">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lavoroPagamenti.map((pagamento) => {
                  const importoMancante = pagamento.importoDovuto - pagamento.importoPagato;
                  return (
                    <TableRow key={pagamento.id} className="hover:bg-gray-50">
                      <TableCell>{formatDate(pagamento.dataModifica)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(pagamento.importoDovuto)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(pagamento.importoPagato)}</TableCell>
                      <TableCell className={importoMancante > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(importoMancante)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{pagamento.causale}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPagamento(pagamento)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePagamento(pagamento.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Pagamenti;
