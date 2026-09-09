import { toast } from '@/hooks/use-toast';
import { ClientResponseError } from 'pocketbase'
export function errors(err)
{
    let mensagem = 'Erro '
    console.log(err);
    if(err instanceof ClientResponseError)
    {
        console.log('---------------ERROR-----------------')
        console.log(err);
        if(err.status === 400)
        {
            mensagem += 'Email ou senha Invalidos';
        }
        else if (err.status === 0)
        {
            mensagem += 'Sem conexão com o servidor'
        }
    }
    return mensagem;
}