# Managing a SWA public key

Each SWA model record will require a public/private key registration. The SWA keeps the private key, and emails us the public key.
This SOP describes how to install or rotate a SWA public key in our infrastructure.

As with all administrative tasks, the `Makefile` contains a short help description and details on the underlying commands. If you're not sure
exactly what's going on, the `Makefile` is a good place to start debugging.

All SOPs that involve running a `make` command must be executed within a running container inside the relevant WCMS environment.
See the [Connecting to a WCMS container](./connecting-to-wcms-container.md) SOP.

All these examples use the SWA code `NJ` for New Jersey. The `SWA` value is always the 2-letter code.

## Upload the public key to the container

Use the `kubectl` tool from a machine on the DOL network.

You'll need a pod identifier. Pod identifiers follow the naming pattern `arpa-ui-:random-string:` and you can get the list of identifiers
with:

```
> kubectl get pods
```

If you are in a Windows terminal in the same directory as the public key `.pem` file, you can upload like:

```sh
% kubectl cp ./NJ-public.pem eta-arpa/thepodidentifier:/app/NJ-public.pem
```

## Add a new key to a new SWA

Once the key is uploaded to the container and you are connected, you can add the new key to a new SWA like this:

```sh
> make add-swa-key SWA=NJ PEM=NJ-public.pem
```

## Rotate existing key

The `make add-swa-key` command will, by default, refuse to overwrite any previously set public key value.
We only store one public key at a time. A SWA will want to keep private keys around after they rotate them,
in order to decrypt any Claims that were created with the older public key before we rotated it on our end.

To rotate a key, add the `ROTATE=yes` flag:

```sh
> make add-swa-key SWA=NJ PEM=NJ-public.pem ROTATE=yes
```

All asymmetric encryption will immediately start using the new key.
