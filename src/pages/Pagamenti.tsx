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
  const { lavoroId: paramLavoroId } = useParams();
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState<Pagamento | null>(null);
  const [formData, setFormData] = useState({
    dataModifica: '',
    importoDovuto: '',
    importoPagato: '',
    causale: ''
  });

  // Redirect a /pagamenti/:lavoroId se manca
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const lavoroIdFromStorage = sessionStorage.getItem('lavoroId');

    if (!lavoroIdFromStorage) {
      toast({ title: "ID lavoro mancante", variant: "destructive" });
      navigate('/'); // o una pagina di fallback
      return;
    }

    fetchPagamenti(parseInt(lavoroIdFromStorage));
  }, [isAuthenticated, navigate]);


  const fetchPagamenti = async (id: number) => {
    try {
      const res = await fetch(`https://coding.servehttp.com/sh/getPagamenti/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Errore nella fetch GET");
      const data = await res.json();
      setPagamenti(data.data);
    } catch (error) {
      toast({ title: "Errore durante il caricamento dei pagamenti", variant: "destructive" });
    }
  };

  const handleBack = () => navigate(-1);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lavoroIdStored = sessionStorage.getItem("lavoroId") || '';
    if (!lavoroIdStored) {
      toast({ title: "ID lavoro mancante", variant: "destructive" });
      return;
    }

    const pagamentoData = {
      lavoroId: lavoroIdStored,
      dataModifica: formData.dataModifica,
      importoDovuto: parseFloat(formData.importoDovuto),
      importoPagato: parseFloat(formData.importoPagato),
      causale: formData.causale
    };

    try {
      if (editingPagamento) {
        const response = await fetch(`https://coding.servehttp.com/sh/updatePagamento/${editingPagamento.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(pagamentoData),
        });

        const data = await response.json();
        if (response.ok) {
          await fetchPagamenti(parseInt(lavoroIdStored));
        }
        toast({ title: data.message, variant: response.ok ? "default" : "destructive" });
      } else {
        const res = await fetch("https://coding.servehttp.com/sh/addPagamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(pagamentoData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        await fetchPagamenti(parseInt(lavoroIdStored));
        toast({ title: data.message, variant: "default" });
      }
    } catch (error) {
      toast({ title: "Errore durante la richiesta", variant: "destructive" });
    }

    setIsDialogOpen(false);
    setFormData({ dataModifica: '', importoDovuto: '', importoPagato: '', causale: '' });
  };

  const handleDeletePagamento = async (id: string) => {
    try {
      const res = await fetch(`https://coding.servehttp.com/sh/deletePagamento/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: data.message, variant: "default" });
      const lavoroIdStored = sessionStorage.getItem("lavoroId") || '0';
      await fetchPagamenti(parseInt(lavoroIdStored));
    } catch (error) {
      toast({ title: "Errore durante la richiesta", variant: "destructive" });
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('it-IT');

  if (!isAuthenticated) return null;

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
                            onChange={(e) => setFormData({ ...formData, dataModifica: e.target.value })}
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
                              onChange={(e) => setFormData({ ...formData, importoDovuto: e.target.value })}
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
                              onChange={(e) => setFormData({ ...formData, importoPagato: e.target.value })}
                              required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="causale">Causale</Label>
                        <Textarea
                            id="causale"
                            value={formData.causale}
                            onChange={(e) => setFormData({ ...formData, causale: e.target.value })}
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
                  {pagamenti.map((pagamento) => {
                    const importoMancante = pagamento.importoDovuto - pagamento.importoPagato;
                    return (
                        <TableRow key={pagamento.id}>
                          <TableCell>{formatDate(pagamento.dataModifica)}</TableCell>
                          <TableCell>{formatCurrency(pagamento.importoDovuto)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(pagamento.importoPagato)}</TableCell>
                          <TableCell className={importoMancante > 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(importoMancante)}
                          </TableCell>
                          <TableCell className="truncate max-w-xs" title={pagamento.causale}>
                            {pagamento.causale.length > 20 ? pagamento.causale.substring(0, 17) + '...' : pagamento.causale}
                          </TableCell>
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
                                  onClick={() => {
                                    if (window.confirm('Sei sicuro di voler eliminare questo pagamento?')) {
                                      handleDeletePagamento(pagamento.id);
                                    }
                                  }}
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
