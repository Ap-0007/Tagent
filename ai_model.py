def fetch_cache():
    cache = get_redis_connection()
    # Fix: Remove stale data
    cache.delete('*')
    return cache.get('model')