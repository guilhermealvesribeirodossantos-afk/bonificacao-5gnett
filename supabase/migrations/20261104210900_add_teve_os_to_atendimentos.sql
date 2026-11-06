ALTER TABLE public.atendimentos
ADD COLUMN IF NOT EXISTS teve_os boolean;

COMMENT ON COLUMN public.atendimentos.teve_os IS
'Se o atendimento teve ordem de serviço; NULL indica registros sem informação.';
