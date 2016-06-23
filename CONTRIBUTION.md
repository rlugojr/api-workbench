# Contributing to API Workbench

Do you want to help improve this project?? Here are some instructions to get you started. They are probably not perfect, please let us know if anything feels wrong or incomplete.

## Reporting Issues

When reporting [issues](https://github.com/mulesoft/api-workbench/issues) on GitHub please include the version of the API Workbench you are using and your OS. Please also include the steps required to reproduce the problem if possible and applicable. This information will help us review and fix your issue faster.

As an example:

```
API Workbench Version: 0.0.4
OS: Mac OS X 10.10.3

Steps to Reproduce:
1. Start API Workbench
2. Go to Packages > API Workbench > Create RAML Project
```

## Workflow

* We are using [git triangular workflow](https://www.sociomantic.com/blog/2014/05/git-triangular-workflow/);
* No one, not even the maintainers, push contributions directly into the master;
* All contribution come in through pull requests;
* Each contributor will need to [fork API Workbench](https://github.com/mulesoft/api-workbench/fork) repo on GitHub;
* All contributions are made as commits to your fork;
* A pull request must contain a single feature or a single fix (or a small batch of related fixes);
* Before submitting a pull request, you need to execute `squash commits`. Submit the pull request afterwards to have them considered for merging into the master repo;
* A good summary of some workflow best practice can be found in this [article]( http://blakeembrey.com/articles/2013/04/contributing-to-open-source/).

## Development environment

### Dependencies

* [Github's Atom Editor](https://atom.io/)
* [NodeJS](https://nodejs.org)

After installing Atom, activate `Atom->Install Shell Commands` in Atom menu.

### Installation

1. If other workbench development installation is linked, apm unlink it.
2. `git clone https://github.com/mulesoft/api-workbench.git`
3. `cd api-workbench`
4. `apm install`
5. `npm run devInstall`
6. `npm run buildall`
7. `apm link`

This command sequence will clone a number of GIT repositories to the parent folder of API Workbench repository clone, link repositories together, install NPM dependencies and build projects to produce JavaScript.

After installation is complete, Atom will have API Workbench package linked from the locally built JavaScript sources. To rebuild the project after the TypeScript source code changes run `npm run buildall` again.

Individual sub-projects can be rebuilt using `npm run build` command launched in the respective project directory.

### IDE

The recommended IDE is [IntelliJ IDEA Ultimate](https://www.jetbrains.com/idea/).
Alternatively, following IDEs can be used:
* [Atom](https://atom.io/) with [atom-typescript](https://atom.io/packages/atom-typescript) package.
* [Eclipse](https://eclipse.org/downloads/) with [Palantir's TypeScript plug-in](https://marketplace.eclipse.org/content/typescript), [TypEcs](http://typecsdev.com/), or any other TypeScript plug-in.
* [Visual Studio](https://www.microsoft.com/en-us/download/details.aspx?id=48593) or [Visual Studio Code](https://code.visualstudio.com/)


## Contribution guidelines

### Contributor’s agreement

To contribute source code to this repository, please read our [contributor's agreement](http://www.mulesoft.org/legal/contributor-agreement.html), and then execute it by running this notebook and following the instructions: https://api-notebook.anypoint.mulesoft.com/notebooks/#380297ed0e474010ff43

### Pull requests are always welcome

We are always thrilled to receive pull requests, and do our best to process them as fast as possible. Not sure if that typo is worth a pull request? Do it! We will appreciate it.

If your pull request is not accepted on the first try, don't be discouraged! If there's a problem with the implementation, hopefully you received feedback on what to improve.

We're trying very hard to keep the API Workbench lean and focused. We don't want it to do everything for everybody. This means that we might decide against incorporating a new feature. However, there might be a way to implement that feature on top of API Workbench.

### Create issues...

Any significant improvement should be documented as [a GitHub issue](https://github.com/mulesoft/api-workbench/issues) before anybody
starts working on it.

### ...but check for existing issues first!

Please take a moment to check that an issue doesn't already exist documenting your bug report or improvement proposal. If it does, it never hurts to add a quick "+1" or "I have this problem too". This will help prioritize the most common problems and requests.

### Conventions

Write clean code. Universally formatted code promotes ease of writing, reading, and maintenance. Make sure to avoid unnecessary white space changes which complicate diffs and make reviewing pull requests much more time consuming.

Pull requests descriptions should be as clear as possible and include a reference to all the issues that they address. In other words, please try to explain in full detail the rationale for the change, and if the change is opaque (or hard) try to explain the fix as much as possible.  

Pull requests must not contain commits from other users or branches.

Commit messages must start with a short summary (max. 50 chars) written in the imperative, followed by an optional, more detailed explanatory text which is separated from the summary by an empty line.

Code review comments may be added to your pull request. Discuss, then make the suggested modifications and push additional commits to your feature branch. Be sure to post a comment after pushing. The new commits will show up in the pull request automatically, but the reviewers will not be notified unless you comment.

Before the pull request is merged, make sure that you squash your commits into logical units of work using `git rebase -i` and `git push -f`. After every commit, the test suite should be passing. Include documentation changes in the same commit so that a revert would remove all traces of the feature or fix.

Commits that fix or close an issue should include a reference like Closes #XXX or Fixes #XXX, which will automatically close the issue when merged.

Commits that change or fix bugs on any UI related sources must be accompanied by a screenshot. That also includes changes on any CSS files.

Commits that introduce new features must be accompanied by a short `.gif` with a demo of the feature in action. If possible, the demo must include error handling and all possible scenarios.

Seriously consider adding tests to any commits, good tests can be very descriptive of the problem you are solving and they greatly improve the development experience for other developers. Obviously, changes to the README or other descriptive files do not need any tests.

Some last words, please do not get discouraged if submitting a small fix, requires you to work in a larger refactor than you were expecting. Sometimes the best fix is not a quick and dirty one, but requires a shift in how the application looks at the model.

### Merge approval

The maintainers of this project will review your pull request and, if approved, will merge into the main repo. Commits get approval based on the conventions outlined in the previous section. For example, new features without additional tests will be not approved.
