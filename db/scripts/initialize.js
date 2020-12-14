function initialize() {
    // Initialize database. This prevents this script from inserting the records many times
    print("Initialize database...")
    db.initialization.insert({
        creation: new Date()
    })

    // Load the initial state
    load("/data/scripts/initial-state.js")

    // Insert clients
    print("Insert default clients")
    db.client.insertMany(clients)

    // Insert accounts
    profiles.forEach((profile) => {
        const accountId = ObjectId().str
        db.account.insert({
            _id: accountId,
            payload: {
                accountId,
                profile
            }
        })
    })
}


!function main() {
    print("Check database initialized")
    const initialized = !!db.initialization.count()
    if (!initialized) {
        initialize()
    }
}()
