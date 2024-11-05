# Update search queries to use LIKE instead of ILIKE
if search_term:
    query = query.filter(Pallet.name.like(f'%{search_term}%'))
