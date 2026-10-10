# Moving Sanctuario to Codeberg

## Name and addresses

The app display name and repository name are **Sanctuario** and `sanctuario`.

With a Codeberg account named `USERNAME`:

- Repository: `https://codeberg.org/USERNAME/sanctuario`
- Website: `https://USERNAME.codeberg.page/sanctuario/`

These are templates until the owner supplies their Codeberg username and completes publishing. Codeberg provides the domain, HTTPS and static hosting. No domain purchase, DNS setup, server or build service is needed. The app uses relative URLs and has no runtime packages or external scripts.

## Transfer the saved garden first

Git history contains the app and starter content. Saved plants, personal photos and map locations live in each device's browser, so a repository migration cannot transfer them.

1. Publish the rename and backup-page changes to the existing GitHub Pages site before retiring it. Follow the repository rule that only the owner pushes commits.
2. On each device with saved garden data, open **Respaldo / Backup** at the existing website and download a backup file. Keep those files outside Git.
3. After the Codeberg website is live, open **Respaldo / Backup** there in the same device's browser, select its backup and restore it. Restore replaces that browser's collection and house position. If the destination already has data you want to keep, export it first.
4. Check personal photos, plant locations and the house position on **Plantas** and **Mapa** before retiring the old website. Open the new website once online before checking offline use.
5. Update bookmarks and reinstall the home-screen app from the Codeberg address. An existing GitHub installation still belongs to the old address.

The name change keeps the database identifier stable, preserving existing data at the old origin. Moving to Codeberg changes the origin; the backup is the explicit transfer between them. Restore uses one IndexedDB transaction for the full collection, so a failed write does not leave half an import. The house position is restored separately in local storage; the page reports if that storage is unavailable.

## Move the repository

Codeberg's **+ → New Migration** can import the current public repository:

```text
https://github.com/laurenball/mi_jardin_app.git
```

Choose `sanctuario` as the destination name and a normal migration, rather than a continuously synchronized mirror. A Git migration carries the code and history; the GitHub migration option can also carry issues and other metadata. Codeberg Pages requires the destination repository to be public.

After creating or migrating the destination, update this checkout. Replace `USERNAME` with the actual account name:

```bash
git remote rename origin github
git remote add origin git@codeberg.org:USERNAME/sanctuario.git
```

This keeps the GitHub remote available for the data-transfer period. Check `git remote -v` before publishing. Configure your SSH key in Codeberg, or use its HTTPS clone URL if that is your preferred authentication method.

## Set up Codeberg Pages

The current Pages service uses a Forgejo webhook and a `pages` branch.

1. In the Codeberg repository, create a `pages` branch from `main` using the branch selector. This gives Pages a branch before setting up the webhook.
2. Open **Settings → Webhooks → Add webhook → Forgejo**.
3. Set the target URL to `https://USERNAME.codeberg.page/sanctuario/`.
4. Set the branch filter to `pages`, keep push events enabled and the webhook active, then save it.
5. The owner publishes the local commits:

```bash
git push -u origin main
git push origin main:pages
```

The second command sends the local `main` commit to the remote `pages` branch. A new branch or commit triggers the webhook. If Codeberg's UI created `pages` at exactly that commit already, an up-to-date push produces no event; publish the next committed change to `pages` to trigger deployment. Do not force-push to work around a divergent branch: check and resolve the difference first.

Verify the webhook delivery after a real branch update and visit the website. Codeberg's **Test delivery** button is not a deployment test and is documented to fail. For future updates, the owner runs `npm run build`, `npm run check`, commits on `main`, then publishes both branches with the commands above.

## Free software and photo rights

Codeberg's forge and Pages hosting run free/libre software. A hosting migration does not itself license this app's source code, and this repository does not yet declare a software license. Choose and add one before describing the app itself as FOSS or publishing it as a free software project on Codeberg.

Third-party photos keep their own rights. Plant sources and available licenses are recorded in `PHOTO_SOURCES.md`; bird credits link to individual Macaulay Library records in `birds.js`. Some photos have no recorded open license and must not be described as freely redistributable merely because the code receives a license. Keep the credits and confirm the publication rights or use suitable replacements for any public distribution.

## References

- [Codeberg Pages setup](https://docs.codeberg.org/codeberg-pages/)
- [Repository migration](https://docs.codeberg.org/advanced/migrating-repos/)
- [Codeberg licensing expectations](https://docs.codeberg.org/getting-started/faq/)
- [Choosing a license](https://docs.codeberg.org/getting-started/licensing/)
