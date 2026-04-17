-- HR P0-02 (Surveys anonymity real)
--
-- When a survey is marked isAnonymous=true the submit-response use-case must
-- never persist employeeId — anyone with DB access could otherwise
-- de-anonymize the respondent, breaking the psychological safety guarantee
-- that makes engagement / pulse / exit surveys useful in the first place.
--
-- The problem: we still need to reject duplicate submissions from the same
-- employee ("one response per person"). We solve that with a one-way hash of
-- (tenantId || surveyId || employeeId || ANON_HASH_SECRET) stored in
-- respondent_hash. The server can check "already submitted?" by recomputing
-- the same hash on submission, but the hash cannot be reversed back to an
-- employeeId without the secret — and is never exposed through any API.
--
-- employeeId stays nullable (already was) but the use-case now forces it to
-- NULL whenever the survey is anonymous. The @@unique(surveyId,
-- respondent_hash) constraint enforces single submission per anonymous
-- respondent at the DB level. For non-anonymous surveys respondent_hash is
-- NULL and the existing findByEmployeeAndSurvey dedupe applies.

ALTER TABLE "survey_responses"
  ADD COLUMN "respondent_hash" VARCHAR(64);

-- Postgres treats NULLs in unique indexes as distinct, so non-anonymous
-- responses (respondent_hash = NULL) do not collide with each other.
CREATE UNIQUE INDEX "survey_responses_survey_id_respondent_hash_key"
  ON "survey_responses" ("survey_id", "respondent_hash");
