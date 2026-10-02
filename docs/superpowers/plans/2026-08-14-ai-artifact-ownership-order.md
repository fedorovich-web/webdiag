# AI artifact ownership-order implementation plan

1. Add a failing API test proving a missing artifact returns 404 without
   initializing storage.
2. Add a service ownership guard and chain it before the storage dependency.
3. Retain the service guard during object reads as defense in depth.
4. Run affected artifact/account/internal tests, Ruff, and the full Python gate.
