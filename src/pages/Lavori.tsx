import React, {useState, useEffect} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {ArrowLeft, Plus, Trash2, Edit} from 'lucide-react';
import {toast} from '@/hooks/use-toast';

interface Lavoro {
    id: string;
    clienteId: string;
    titolo: string;
    descrizione: string;
    stato: 'in corso' | 'completato' | 'sospeso' | 'annullato';
}

const Lavori = () => {
    const {isAuthenticated} = useAuth();
    const navigate = useNavigate();
    const [lavori, setLavori] = useState<Lavoro[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLavoro, setEditingLavoro] = useState<Lavoro | null>(null);
    const [formData, setFormData] = useState({
        titolo: '',
        descrizione: '',
        stato: 'in corso' as Lavoro['stato']
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }
        fetchLavori(parseInt(sessionStorage.getItem("clienteId") || '0'));
    }, [isAuthenticated, navigate]);

    const fetchLavori = async (id: number) => {
        setLoading(true);
        try {
            const res = await fetch(`https://coding.servehttp.com/sh/getLavori/${id}`, {
                method: "GET",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
            });
            if (!res.ok) throw new Error("Errore nella fetch GET");
            const data = await res.json();
            setLavori(data.data);
        } catch (error) {
            toast({title: "Errore durante il caricamento dei lavori", variant: "destructive"});
        } finally {
            setLoading(false);
        }
    }

    const handleBack = () => {
        navigate('/clienti');
    };

    const handleAddLavoro = () => {
        setEditingLavoro(null);
        setFormData({titolo: '', descrizione: '', stato: 'in corso'});
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (editingLavoro) {
            try {
                const response = await fetch(`https://coding.servehttp.com/sh/updateLavoro/${editingLavoro.id}`, {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"},
                    credentials: "include",
                    body: JSON.stringify(formData),
                });

                const data = await response.json();

                if (response.ok) {
                    await fetchLavori(parseInt(sessionStorage.getItem("clienteId") || '0'));
                }

                toast({title: data.message, variant: (response.ok ? "default" : "destructive")});
            } catch (error) {
                toast({title: "Errore durante la richiesta", variant: "destructive"});
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const res = await fetch("https://coding.servehttp.com/sh/addLavoro", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    credentials: "include",
                    body: JSON.stringify({...formData, idCliente: sessionStorage.getItem("clienteId")}),
                });
                if (!res.ok) throw new Error("Errore nella fetch POST");
                const data = await res.json();
                await fetchLavori(parseInt(sessionStorage.getItem("clienteId") || '0'));
                toast({title: data.message, variant: (res.ok ? "default" : "destructive")});
            } catch (error) {
                toast({title: "Errore durante la richiesta", variant: "destructive"});
            } finally {
                setLoading(false);
            }
        }

        setIsDialogOpen(false);
        setFormData({titolo: '', descrizione: '', stato: 'in corso'});
    };


    const handleDeleteLavoro = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`https://coding.servehttp.com/sh/deleteLavoro/${id}`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
            });
            if (!res.ok) {
                throw new Error("Errore nella fetch DELETE");
            }
            const data = await res.json();
            toast({title: data.message, variant: (res.ok ? "default" : "destructive")});
            await fetchLavori(parseInt(sessionStorage.getItem("clienteId") || '0'));
        } catch (error) {
            toast({title: "Errore durante la richiesta", variant: "destructive"});
        } finally {
            setLoading(false);
        }
    };


    const handleLavoroClick = (lavoroId: string) => {
        sessionStorage.setItem("lavoroId", lavoroId);
        navigate(`/pagamenti`);
    };

    const getStatoColor = (stato: Lavoro['stato']) => {
        switch (stato) {
            case 'completato':
                return 'text-green-600 bg-green-100';
            case 'in corso':
                return 'text-blue-600 bg-blue-100';
            case 'sospeso':
                return 'text-yellow-600 bg-yellow-100';
            case 'annullato':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatoLabel = (stato: Lavoro['stato']) => {
        switch (stato) {
            case 'completato':
                return 'Completato';
            case 'in corso':
                return 'In Corso';
            case 'sospeso':
                return 'Sospeso';
            case 'annullato':
                return 'Annullato';
            default:
                return stato;
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
                            <Button onClick={handleBack} variant="outline" size="sm"
                                    className="flex items-center gap-2" disabled={loading}>
                                <ArrowLeft className="h-4 w-4"/>
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
                                    <Button onClick={handleAddLavoro}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                            disabled={loading}>
                                        <Plus className="h-4 w-4"/>
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
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="descrizione">Descrizione</Label>
                                            <Textarea
                                                id="descrizione"
                                                value={formData.descrizione}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    descrizione: e.target.value
                                                })}
                                                required
                                                rows={3}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="stato">Stato</Label>
                                            <Select value={formData.stato}
                                                    onValueChange={(value: Lavoro['stato']) => setFormData({
                                                        ...formData,
                                                        stato: value
                                                    })}
                                                    disabled={loading}>
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="in corso">In Corso</SelectItem>
                                                    <SelectItem value="completato">Completato</SelectItem>
                                                    <SelectItem value="sospeso">Sospeso</SelectItem>
                                                    <SelectItem value="annullato">Annullato</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline"
                                                    onClick={() => setIsDialogOpen(false)}
                                                    disabled={loading}>
                                                Annulla
                                            </Button>
                                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700"
                                                    disabled={loading}>
                                                {editingLavoro ? 'Aggiorna' : 'Aggiungi'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg"
                                     fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor"
                                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                            </div>
                        ) : (
                            <div className="max-h-[calc(80vh-120px)] overflow-y-auto">
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
                                        {lavori.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                                    Nessun lavoro trovato.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            lavori.map((lavoro) => (
                                                <TableRow
                                                    key={lavoro.id}
                                                    className="hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => !loading && handleLavoroClick(lavoro.id)}
                                                >
                                                    <TableCell className="font-medium">{lavoro.titolo}</TableCell>
                                                    <TableCell
                                                        className="max-w-xs truncate">{lavoro.descrizione}</TableCell>
                                                    <TableCell>
                              <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatoColor(lavoro.stato)}`}>
                                {getStatoLabel(lavoro.stato)}
                              </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex justify-center gap-2"
                                                             onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEditLavoro(lavoro)}
                                                                className="h-8 w-8 p-0"
                                                                disabled={loading}
                                                            >
                                                                <Edit className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteLavoro(lavoro.id)}
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                                disabled={loading}
                                                            >
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default Lavori;
