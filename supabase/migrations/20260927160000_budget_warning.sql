-- Budgetbewaking: vanaf welk deel van de aanvaarde offerte (in %) een job een waarschuwing
-- krijgt. Een instelling, geen vaste waarde in de code.
alter table public.settings
  add column budget_warning_percent smallint not null default 80
    check (budget_warning_percent between 1 and 100);
