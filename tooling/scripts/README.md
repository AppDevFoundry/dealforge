# Development Scripts

This directory contains development scripts for the DealForge project.

## Scripts

### setup.sh

Initial project setup script. Run this after cloning the repository:

```bash
./tooling/scripts/setup.sh
```

This script will:
1. Check for required dependencies (Node.js, pnpm, Rust, Go)
2. Install Node.js dependencies
3. Set up environment variables
4. Run initial database migrations (if DATABASE_URL is set)

## Adding New Scripts

When adding new scripts:
1. Make them executable: `chmod +x script-name.sh`
2. Add documentation in this README
3. Use bash for shell scripts for cross-platform compatibility
4. Use TypeScript (with tsx) for complex scripts that need type safety
