-- Create inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  low_stock_threshold NUMERIC DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service schedule table
CREATE TABLE public.service_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL DEFAULT '18:00',
  location TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this NGO internal tool)
CREATE POLICY "Allow all operations on inventory_items"
ON public.inventory_items
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on service_schedule"
ON public.service_schedule
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on chat_messages"
ON public.chat_messages
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_schedule_updated_at
BEFORE UPDATE ON public.service_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.inventory_items (name, category, quantity, unit, low_stock_threshold) VALUES
('Rice', 'grains', 50, 'kg', 10),
('Pasta', 'grains', 30, 'kg', 10),
('Tomato Sauce', 'canned', 40, 'cans', 15),
('Vegetables', 'fresh', 25, 'kg', 8),
('Cooking Oil', 'oils', 15, 'liters', 5);

INSERT INTO public.service_schedule (date, time, location, status) VALUES
(CURRENT_DATE, '18:00', 'Downtown Main Street', 'scheduled'),
(CURRENT_DATE + 1, '18:30', 'Downtown Main Street', 'scheduled'),
(CURRENT_DATE + 3, '18:00', 'Downtown Main Street', 'scheduled'),
(CURRENT_DATE + 5, '18:00', 'Park Avenue Corner', 'scheduled');