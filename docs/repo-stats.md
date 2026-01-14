# Repository Statistics Commands

Reference for calculating repository size and line counts.

## Excluded Directories

These generated/dependency directories are excluded from all counts:

- `node_modules/` - npm dependencies
- `.git/` - git history
- `dist/` - build output
- `.next/` - Next.js build cache
- `target/` - Rust build output
- `.turbo/` - Turborepo cache
- `pkg/` - WASM package output

## Commands

### Count Total Files

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.go" -o -name "*.rs" -o -name "*.json" -o -name "*.md" -o -name "*.css" -o -name "*.html" -o -name "*.sql" -o -name "*.toml" -o -name "*.yaml" -o -name "*.yml" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/.next/*" \
  ! -path "*/target/*" \
  ! -path "*/.turbo/*" \
  ! -path "*/pkg/*" \
  | wc -l
```

### Count Total Lines

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.go" -o -name "*.rs" -o -name "*.json" -o -name "*.md" -o -name "*.css" -o -name "*.html" -o -name "*.sql" -o -name "*.toml" -o -name "*.yaml" -o -name "*.yml" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/.next/*" \
  ! -path "*/target/*" \
  ! -path "*/.turbo/*" \
  ! -path "*/pkg/*" \
  -exec cat {} + 2>/dev/null | wc -l
```

### Count Files by Extension

```bash
for ext in ts tsx js jsx go rs json md css sql toml yaml yml; do
  count=$(find . -type f -name "*.$ext" \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/dist/*" \
    ! -path "*/.next/*" \
    ! -path "*/target/*" \
    ! -path "*/.turbo/*" \
    ! -path "*/pkg/*" 2>/dev/null | wc -l)
  if [ "$count" -gt 0 ]; then
    printf "%4d .%s\n" $count "$ext"
  fi
done
```

### Count Lines by Extension

```bash
for ext in ts tsx js jsx go rs json md css sql; do
  lines=$(find . -type f -name "*.$ext" \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/dist/*" \
    ! -path "*/.next/*" \
    ! -path "*/target/*" \
    ! -path "*/.turbo/*" \
    ! -path "*/pkg/*" \
    -exec cat {} + 2>/dev/null | wc -l)
  if [ "$lines" -gt 0 ]; then
    printf "%6d .%s\n" $lines "$ext"
  fi
done
```

## Alternative: Using cloc

If `cloc` (Count Lines of Code) is installed, it provides more detailed statistics:

```bash
# Install if needed: brew install cloc

cloc . --exclude-dir=node_modules,.git,dist,.next,target,.turbo,pkg
```

This gives a breakdown including blank lines, comments, and actual code lines.
