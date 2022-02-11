# -*- coding: utf-8 -*-
class ClaimSerializer(object):
    def __init__(self, claim):
        self.claim = claim

    def for_swa(self):
        events = self.claim.public_events()
        return {
            "id": str(self.claim.uuid),
            "created_at": str(self.claim.created_at),
            "updated_at": str(self.claim.updated_at),
            "claimant_id": self.claim.claimant_id,
            "events": events,
            "status": self.claim.status,
        }

    def for_claimant(self):
        return {
            "id": str(self.claim.uuid),
            "created_at": str(self.claim.created_at),
            "updated_at": str(self.claim.updated_at),
            "status": (
                self.claim.status
                if self.claim.status
                else self.claim.status_for_claimant()
            ),
            "completed_at": self.claim.completed_at(),
            "deleted_at": self.claim.deleted_at(),
            "fetched_at": self.claim.fetched_at(),
            "resolved_at": self.claim.resolved_at(),
            "resolution": self.claim.resolution_description(),
        }
