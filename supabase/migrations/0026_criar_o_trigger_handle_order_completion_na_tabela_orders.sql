-- Criar o trigger para gerar comissões e transações
CREATE TRIGGER handle_order_completion
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status <> 'completed')
EXECUTE FUNCTION handle_order_completion();