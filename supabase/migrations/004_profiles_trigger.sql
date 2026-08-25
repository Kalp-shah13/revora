  -- ============================================================
  -- Migration 004: Auto-create profile row on new user signup
  -- ============================================================
  -- This trigger fires after a new row is inserted into auth.users
  -- and automatically creates a matching profiles row.
  -- Default role is 'business_owner' — Super Admin must be set manually.
  -- ============================================================

  create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer set search_path = public
  as $$
  begin
    insert into public.profiles (id, full_name, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      coalesce(new.raw_user_meta_data->>'role', 'business_owner')
    );
    return new;
  end;
  $$;

  -- Drop trigger if it already exists (idempotent)
  drop trigger if exists on_auth_user_created on auth.users;

  -- Create the trigger
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
