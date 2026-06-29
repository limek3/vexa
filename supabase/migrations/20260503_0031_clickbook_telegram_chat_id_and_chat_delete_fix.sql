-- Stores master Telegram chat_id on older linked accounts so owner notifications can be delivered.
-- Also keeps chat deletion persistent through sloty_workspaces.data.deletedChatKeys.

update sloty_telegram_accounts a
set
  chat_id = coalesce(
    a.chat_id,
    (
      select r.chat_id
      from sloty_telegram_login_requests r
      where r.telegram_id = a.telegram_id
        and r.chat_id is not null
      order by r.confirmed_at desc nulls last, r.updated_at desc nulls last
      limit 1
    )
  ),
  updated_at = now()
where a.chat_id is null
  and exists (
    select 1
    from sloty_telegram_login_requests r
    where r.telegram_id = a.telegram_id
      and r.chat_id is not null
  );
