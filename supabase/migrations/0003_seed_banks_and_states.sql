-- SatyaVoice / VaaniX Seed Data
-- Migration: 0003_seed_banks_and_states.sql

-- 1. Demo Bank (Exactly one sample bank with reserved .example domain)
insert into public.banks (name, fraud_email, is_demo)
values ('Sample Bank (Demo)', 'fraud@samplebank.example', true)
on conflict do nothing;

-- 2. Cyber Cells for all 28 States and 8 Union Territories of India
-- Strictly email = NULL, verified = false, portal_url = 'https://cybercrime.gov.in'
-- Official emails will only be added with verified sources.
insert into public.cyber_cells (state_code, state_name, email, portal_url, source_url, verified, verified_on)
values
  -- States
  ('AP', 'Andhra Pradesh', null, 'https://cybercrime.gov.in', null, false, null),
  ('AR', 'Arunachal Pradesh', null, 'https://cybercrime.gov.in', null, false, null),
  ('AS', 'Assam', null, 'https://cybercrime.gov.in', null, false, null),
  ('BR', 'Bihar', null, 'https://cybercrime.gov.in', null, false, null),
  ('CG', 'Chhattisgarh', null, 'https://cybercrime.gov.in', null, false, null),
  ('GA', 'Goa', null, 'https://cybercrime.gov.in', null, false, null),
  ('GJ', 'Gujarat', null, 'https://cybercrime.gov.in', null, false, null),
  ('HR', 'Haryana', null, 'https://cybercrime.gov.in', null, false, null),
  ('HP', 'Himachal Pradesh', null, 'https://cybercrime.gov.in', null, false, null),
  ('JH', 'Jharkhand', null, 'https://cybercrime.gov.in', null, false, null),
  ('KA', 'Karnataka', null, 'https://cybercrime.gov.in', null, false, null),
  ('KL', 'Kerala', null, 'https://cybercrime.gov.in', null, false, null),
  ('MP', 'Madhya Pradesh', null, 'https://cybercrime.gov.in', null, false, null),
  ('MH', 'Maharashtra', null, 'https://cybercrime.gov.in', null, false, null),
  ('MN', 'Manipur', null, 'https://cybercrime.gov.in', null, false, null),
  ('ML', 'Meghalaya', null, 'https://cybercrime.gov.in', null, false, null),
  ('MZ', 'Mizoram', null, 'https://cybercrime.gov.in', null, false, null),
  ('NL', 'Nagaland', null, 'https://cybercrime.gov.in', null, false, null),
  ('OD', 'Odisha', null, 'https://cybercrime.gov.in', null, false, null),
  ('PB', 'Punjab', null, 'https://cybercrime.gov.in', null, false, null),
  ('RJ', 'Rajasthan', null, 'https://cybercrime.gov.in', null, false, null),
  ('SK', 'Sikkim', null, 'https://cybercrime.gov.in', null, false, null),
  ('TN', 'Tamil Nadu', null, 'https://cybercrime.gov.in', null, false, null),
  ('TS', 'Telangana', null, 'https://cybercrime.gov.in', null, false, null),
  ('TR', 'Tripura', null, 'https://cybercrime.gov.in', null, false, null),
  ('UP', 'Uttar Pradesh', null, 'https://cybercrime.gov.in', null, false, null),
  ('UK', 'Uttarakhand', null, 'https://cybercrime.gov.in', null, false, null),
  ('WB', 'West Bengal', null, 'https://cybercrime.gov.in', null, false, null),
  -- Union Territories
  ('AN', 'Andaman and Nicobar Islands', null, 'https://cybercrime.gov.in', null, false, null),
  ('CH', 'Chandigarh', null, 'https://cybercrime.gov.in', null, false, null),
  ('DN', 'Dadra and Nagar Haveli and Daman and Diu', null, 'https://cybercrime.gov.in', null, false, null),
  ('DL', 'Delhi', null, 'https://cybercrime.gov.in', null, false, null),
  ('JK', 'Jammu and Kashmir', null, 'https://cybercrime.gov.in', null, false, null),
  ('LA', 'Ladakh', null, 'https://cybercrime.gov.in', null, false, null),
  ('LD', 'Lakshadweep', null, 'https://cybercrime.gov.in', null, false, null),
  ('PY', 'Puducherry', null, 'https://cybercrime.gov.in', null, false, null)
on conflict (state_code) do update set
  state_name = excluded.state_name,
  portal_url = excluded.portal_url;
