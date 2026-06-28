-- ClickBook DEV RESET — очистка данных приложения для тестового запуска.
-- Запускай только если понимаешь, что удаляешь ВСЕ профили, записи, чаты, услуги, подписки и Telegram-связки.
-- Supabase Auth пользователей лучше удалить через Authentication -> Users.

begin;

do $$
declare
  table_name text;
  tables text[] := array[
    'public.sloty_subscription_events',
    'public.sloty_workspace_subscriptions',
    'public.sloty_marketing_campaigns',
    'public.sloty_booking_telegram_links',
    'public.sloty_booking_vk_links',
    'public.sloty_telegram_login_requests',
    'public.sloty_telegram_accounts',
    'public.sloty_chat_messages',
    'public.sloty_chat_threads',
    'public.sloty_bookings',
    'public.sloty_workspace_members',
    'public.sloty_workspaces'
  ];
begin
  foreach table_name in array tables loop
    if to_regclass(table_name) is not null then
      execute format('truncate table %s restart identity cascade', table_name);
    end if;
  end loop;
end $$;

commit;

-- ОПЦИОНАЛЬНО, только для полностью тестовой базы:
-- Это удалит всех пользователей Supabase Auth и разлогинит все браузеры.
-- Лучше делать через Supabase Dashboard -> Authentication -> Users.
-- delete from auth.users;
