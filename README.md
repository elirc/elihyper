# HyperNova Inc

This is a Next.js project bootstrapped with [`create-plasmic-app`](https://www.npmjs.com/package/create-plasmic-app) and deployed with AWS Amplify.

## Getting Started

First, run the development server:

```bash
npm run dev
```

or for full build

```bash
npm run build
```

```bash
npm run start
```

Open your browser to see the result.

You can start editing your project in Plasmic Studio. The page auto-updates as you edit the project.

## AWS Amplify Integration

This application is configured to work with AWS Amplify for hosting and deployment. Amplify provides a complete fullstack development platform that enables teams to build, ship, and host web applications with continuous deployment and backend environments.

### Key Features

- **Continuous Deployment**: Automatic builds and deployments from your Git repository
- **Branch-based Environments**: Multiple backend and frontend environments for development, staging, and production
- **Team Collaboration**: Multi-developer workflows with isolated environments
- **Pull Request Previews**: Preview changes before merging with temporary backend environments
- **Global CDN**: Frontend assets served via AWS CloudFront
- **Backend Integration**: GraphQL APIs, Lambda functions, and other AWS services deployed automatically

## Team Development Workflow

This project uses a simplified two-branch workflow with backend environments:

### Branch Structure

- **main** branch → `prod` backend environment (production)
- **dev** branch → `dev` backend environment (development/staging)
- **feature** branches → use `dev` backend environment or create temporary environments as needed

### Workflow Process

1. **Feature Development**: Create feature branches from `dev` branch
2. **Local Development**: Use `dev` backend environment with `amplify env checkout dev`
3. **Pull Request**: Create PR from feature branch to `dev` branch
4. **Code Review**: Review changes in the development environment
5. **Development Testing**: Merge to `dev` branch for integration testing
6. **Production Release**: Merge `dev` to `main` for production deployment

### Backend Environment Strategy

- **Shared Development**: Feature branches share the `dev` backend environment for collaboration
- **Temporary Environments**: Create isolated backend environments for complex features when needed
- **Production Isolation**: `main` branch maintains its own `prod` backend environment

### Pull Request Previews

Amplify provides web previews for pull requests, allowing teams to preview changes before merging:

- **Unique Preview URLs**: Each PR gets a temporary deployment URL
- **Temporary Backend**: PRs create isolated backend environments (private repos only)
- **Security**: Preview deployments are restricted for security on public repositories
- **Automatic Cleanup**: Preview environments are deleted when PRs are closed

**Enabling Web Previews:**

1. Navigate to **Hosting** → **Previews** in the Amplify Console
2. Install and authorize the Amplify GitHub App (for GitHub repos)
3. Configure repository permissions
4. Enable previews for your branches

### Environment Management

**Creating Environments:**

```bash
# Add a new environment
amplify env add
? Enter a name for the environment: dev
? Do you want to use an existing environment? No

# Switch between environments
amplify env checkout prod
amplify env checkout dev

# List all environments
amplify env list

# Remove an environment (temporary feature environments)
amplify env remove featurename
```

### Amplify Commands

```bash
# Initialize Amplify (if not already done)
amplify init

# Push changes to Amplify
amplify push

# Check status of Amplify resources
amplify status

# View current environment
amplify env list
```

## Learn More

With Plasmic, you can enable non-developers on your team to publish pages and content into your website or app.

To learn more about Plasmic, take a look at the following resources:

- [Plasmic Website](https://www.plasmic.app/)
- [Plasmic Documentation](https://docs.plasmic.app/learn/)
- [Plasmic Community Forum](https://forum.plasmic.app/)

You can check out [the Plasmic GitHub repository](https://github.com/plasmicapp/plasmic) - your feedback and contributions are welcome!

### AWS Amplify Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Amplify Gen 1 CLI Teams Guide](https://docs.amplify.aws/gen1/javascript/tools/cli/teams/)
- [Amplify Console](https://console.aws.amazon.com/amplify/)